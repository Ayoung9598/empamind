import json
import os
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

def save_message(user_id, chat_id, message, response, sentiment, chat_title=None):
    """Save user message and AI response to DynamoDB"""
    table = dynamodb.Table(TABLE_NAME)
    timestamp = datetime.utcnow().isoformat()
    message_id = f"{int(datetime.utcnow().timestamp() * 1000)}-{os.urandom(4).hex()}"
    
    # Generate title from first message if not provided
    if chat_title is None:
        chat_title = message[:50] + "..." if len(message) > 50 else message
    
    try:
        # Save user message
        table.put_item(
            Item={
                'userId': user_id,
                'timestamp': timestamp,
                'chatId': chat_id,
                'messageId': message_id,
                'sender': 'user',
                'text': message,
                'sentiment': sentiment,
                'chatTitle': chat_title
            }
        )
        
        # Save AI response
        response_timestamp = datetime.utcnow().isoformat()
        response_id = f"{int(datetime.utcnow().timestamp() * 1000)}-{os.urandom(4).hex()}"
        table.put_item(
            Item={
                'userId': user_id,
                'timestamp': response_timestamp,
                'chatId': chat_id,
                'messageId': response_id,
                'sender': 'ai',
                'text': response,
                'sentiment': sentiment,
                'chatTitle': chat_title
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
        
        # Generate chat_id if not provided (new chat)
        if not chat_id:
            chat_id = f"{user_id}-{int(datetime.utcnow().timestamp() * 1000)}"
        
        # Detect sentiment
        sentiment = detect_sentiment(message)
        
        # Get recent chat history for context (from this chat only)
        history = get_chat_history(user_id, chat_id=chat_id, limit=20)
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
        save_message(user_id, chat_id, message, response_text, sentiment, chat_title)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': response_text,
                'sentiment': sentiment,
                'chatId': chat_id
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

