import json
import os
import uuid
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Import from Lambda layer (mounted at /opt/python)
from utils import get_user_id, get_cors_headers, get_chat_history

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
comprehend = boto3.client('comprehend', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-micro-v1:0')
TABLE_NAME = os.environ.get('CHAT_TABLE_NAME', 'empamind-chats')

# System prompt for empathetic responses
SYSTEM_PROMPT = """You are EmpaMind, an empathetic AI mental wellness companion designed to help people express their emotions and find comfort. You are specifically designed for Nigerian and African users, though you communicate in English.

Your role:
- Listen actively and show genuine empathy
- Provide warm, supportive, and culturally-aware responses
- Help users process their emotions without judgment
- Offer gentle encouragement and perspective
- Never provide medical advice or diagnose conditions
- If someone is in crisis, encourage them to seek professional help

Your communication style:
- Warm, compassionate, and understanding
- Use natural, conversational language
- Be culturally sensitive to Nigerian/African contexts
- Show that you genuinely care about the user's wellbeing
- Validate their feelings and experiences

Remember: You are a supportive companion, not a replacement for professional therapy."""

def detect_sentiment(text):
    """Detect sentiment using Amazon Comprehend"""
    try:
        response = comprehend.detect_sentiment(
            Text=text,
            LanguageCode='en'
        )
        return response.get('Sentiment', 'NEUTRAL')
    except ClientError as e:
        print(f'Error detecting sentiment: {e}')
        return 'NEUTRAL'

def generate_response(user_message, sentiment, chat_history=None):
    """Generate response using Bedrock Amazon Nova"""
    if chat_history is None:
        chat_history = []
    
    try:
        # Build conversation context
        conversation_context = ""
        if chat_history:
            recent_messages = chat_history[-10:]  # Last 10 messages for context
            conversation_parts = []
            for msg in recent_messages:
                sender = 'User' if msg.get('sender') == 'user' else 'EmpaMind'
                conversation_parts.append(f"{sender}: {msg.get('text', '')}")
            conversation_context = "\n".join(conversation_parts)
        
        sentiment_context = ""
        if sentiment != 'NEUTRAL':
            sentiment_context = f"\n\nNote: The user's message has a {sentiment} sentiment. Respond with appropriate empathy and understanding."
        
        if conversation_context:
            prompt = f"Previous conversation:\n{conversation_context}\n\nCurrent message from user: {user_message}{sentiment_context}"
        else:
            prompt = f"User message: {user_message}{sentiment_context}"
        
        # Prepare Bedrock request for Amazon Nova (uses Converse API format)
        body = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            "system": [{"text": SYSTEM_PROMPT}],
            "inferenceConfig": {
                "maxTokens": 1000
            }
        }
        
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(body)
        )
        
        response_body = json.loads(response['body'].read())
        # Nova response format: output.message.content[0].text
        return response_body['output']['message']['content'][0]['text']
        
    except ClientError as e:
        print(f'Error generating response: {e}')
        raise Exception('Failed to generate response. Please try again.')

def get_latest_chunk(user_id, chat_id):
    """Get the latest chunk for a chat (highest chunkIndex)"""
    table = dynamodb.Table(TABLE_NAME)
    try:
        # Query for all chunks of this chat, sorted by SK descending
        response = table.query(
            KeyConditionExpression='userId = :userId AND begins_with(sk, :chatPrefix)',
            ExpressionAttributeValues={
                ':userId': user_id,
                ':chatPrefix': f"{chat_id}#"
            },
            ScanIndexForward=False,  # Descending order
            Limit=1
        )
        items = response.get('Items', [])
        if items:
            return items[0]
        return None
    except ClientError as e:
        print(f'Error getting latest chunk: {e}')
        return None

def save_message(user_id, chat_uuid, message, response, sentiment, chat_title=None):
    """Save user message and AI response to DynamoDB in chunked format"""
    table = dynamodb.Table(TABLE_NAME)
    timestamp = datetime.utcnow().isoformat()
    
    # Default chat title to chat_uuid if not provided
    if chat_title is None:
        chat_title = chat_uuid
    
    try:
        # Get latest chunk for this chat
        latest_chunk = get_latest_chunk(user_id, chat_uuid)
        
        # Create message pair
        message_pair = [
            {
                'sender': 'user',
                'text': message,
                'sentiment': sentiment,
                'timestamp': timestamp
            },
            {
                'sender': 'ai',
                'text': response,
                'timestamp': timestamp
            }
        ]
        
        if latest_chunk is None:
            # New chat - create chunk 0
            chunk_index = 0
            sk = f"{chat_uuid}#0"
            messages = message_pair
            message_count = 2
        else:
            # Existing chat - check if latest chunk has space
            existing_messages = latest_chunk.get('messages', [])
            message_count = latest_chunk.get('messageCount', len(existing_messages))
            
            # Check if chunk is full (~200 message pairs = 400 messages)
            # Using 200 as safe limit (400KB / ~2KB per pair)
            if message_count >= 400:  # 200 pairs * 2 messages
                # Create new chunk
                chunk_index = latest_chunk.get('chunkIndex', 0) + 1
                sk = f"{chat_uuid}#{chunk_index}"
                messages = message_pair
                message_count = 2
                # Preserve chat title from previous chunk
                chat_title = latest_chunk.get('chatTitle', chat_uuid)
            else:
                # Append to existing chunk
                chunk_index = latest_chunk.get('chunkIndex', 0)
                sk = f"{chat_uuid}#{chunk_index}"
                messages = existing_messages + message_pair
                message_count = len(messages)
                # Preserve existing chat title
                chat_title = latest_chunk.get('chatTitle', chat_uuid)
        
        # Save or update chunk
        table.put_item(
            Item={
                'userId': user_id,
                'sk': sk,
                'chatId': chat_uuid,
                'chunkIndex': chunk_index,
                'timestamp': timestamp,
                'messages': messages,
                'chatTitle': chat_title,
                'messageCount': message_count
            }
        )
    except ClientError as e:
        print(f'Error saving messages: {e}')
        # Don't throw - allow response to be sent even if save fails

def handler(event, context):
    """Lambda handler function for sending messages"""
    print(f'Received event: {json.dumps(event)}')
    
    headers = get_cors_headers()
    
    # Handle OPTIONS request
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method == 'OPTIONS' or event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        user_id = get_user_id(event)
        body = json.loads(event.get('body', '{}'))
        message = body.get('message', '').strip()
        chat_id = body.get('chatId')
        chat_title = body.get('title')
        
        if not message:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Message is required'})
            }
        
        # Generate chat_uuid if not provided (new chat)
        if not chat_id:
            chat_uuid = uuid.uuid4().hex
        else:
            chat_uuid = chat_id
        
        # Detect sentiment
        sentiment = detect_sentiment(message)
        
        # Get recent chat history for context (from this chat only)
        history = get_chat_history(user_id, chat_id=chat_uuid, limit=20)
        chat_history = [
            {
                'sender': item.get('sender'),
                'text': item.get('text')
            }
            for item in history
        ]
        
        # Generate response
        response_text = generate_response(message, sentiment, chat_history)
        
        # Save messages
        save_message(user_id, chat_uuid, message, response_text, sentiment, chat_title)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': response_text,
                'sentiment': sentiment,
                'chatId': chat_uuid
            })
        }
        
    except Exception as e:
        print(f'Error processing request: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

