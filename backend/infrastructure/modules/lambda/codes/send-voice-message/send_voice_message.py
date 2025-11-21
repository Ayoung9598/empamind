import json
import os
import uuid
import base64
import boto3
import time
import urllib.request
from datetime import datetime
from botocore.exceptions import ClientError

# Import from Lambda layer (mounted at /opt/python)
from utils import get_user_id, get_cors_headers, get_chat_history

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
comprehend = boto3.client('comprehend', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
transcribe = boto3.client('transcribe', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
polly = boto3.client('polly', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
s3 = boto3.client('s3', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-micro-v1:0')
TABLE_NAME = os.environ.get('CHAT_TABLE_NAME', 'empamind-chats')
S3_BUCKET = os.environ.get('TRANSCRIBE_BUCKET_NAME', '')  # S3 bucket for Transcribe audio storage

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

def transcribe_audio(audio_bytes, audio_format='webm'):
    """Transcribe audio using AWS Transcribe with S3 storage"""
    if not S3_BUCKET:
        raise Exception('S3 bucket not configured for Transcribe. Please set TRANSCRIBE_BUCKET_NAME environment variable.')
    
    try:
        # Map audio format to MediaFormat
        format_map = {
            'webm': 'webm',
            'mp3': 'mp3',
            'wav': 'wav',
            'flac': 'flac',
            'ogg': 'ogg',
            'amr': 'amr',
            'mp4': 'mp4'
        }
        media_format = format_map.get(audio_format.lower(), 'webm')
        
        # Upload audio to S3
        job_name = f"transcribe-{uuid.uuid4().hex}"
        s3_key = f"transcribe/{job_name}.{media_format}"
        
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=audio_bytes
        )
        
        s3_uri = f"s3://{S3_BUCKET}/{s3_key}"
        
        # Start transcription job
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': s3_uri},
            MediaFormat=media_format,
            LanguageCode='en-US'
        )
        
        # Wait for job to complete (max 60 seconds)
        max_wait = 60
        wait_time = 0
        while wait_time < max_wait:
            response = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            status = response['TranscriptionJob']['TranscriptionJobStatus']
            
            if status == 'COMPLETED':
                # Get transcript from S3
                transcript_uri = response['TranscriptionJob']['Transcript']['TranscriptFileUri']
                transcript_data = json.loads(urllib.request.urlopen(transcript_uri).read())
                transcript = transcript_data['results']['transcripts'][0]['transcript']
                
                # Clean up S3 file
                try:
                    s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                except Exception as e:
                    print(f'Warning: Failed to delete S3 object {s3_key}: {e}')
                
                # Clean up transcription job
                try:
                    transcribe.delete_transcription_job(TranscriptionJobName=job_name)
                except Exception as e:
                    print(f'Warning: Failed to delete transcription job {job_name}: {e}')
                
                return transcript
            elif status == 'FAILED':
                failure_reason = response['TranscriptionJob'].get('FailureReason', 'Unknown error')
                # Clean up S3 file on failure
                try:
                    s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
                except:
                    pass
                raise Exception(f'Transcription failed: {failure_reason}')
            
            time.sleep(2)
            wait_time += 2
        
        # Clean up S3 file on timeout
        try:
            s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        except:
            pass
        raise Exception('Transcription job timed out after 60 seconds')
            
    except ClientError as e:
        print(f'Error transcribing audio: {e}')
        raise Exception(f'Failed to transcribe audio: {str(e)}')

def synthesize_speech(text):
    """Convert text to speech using AWS Polly"""
    try:
        response = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId='Joanna',  # Natural-sounding female voice
            Engine='neural'  # Use neural engine for better quality
        )
        
        # Read audio stream
        audio_bytes = response['AudioStream'].read()
        # Encode to base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return audio_base64
        
    except ClientError as e:
        print(f'Error synthesizing speech: {e}')
        raise Exception(f'Failed to synthesize speech: {str(e)}')

def get_latest_chunk(user_id, chat_id):
    """Get the latest chunk for a chat (highest chunkIndex)"""
    table = dynamodb.Table(TABLE_NAME)
    try:
        response = table.query(
            KeyConditionExpression='userId = :userId AND begins_with(sk, :chatPrefix)',
            ExpressionAttributeValues={
                ':userId': user_id,
                ':chatPrefix': f"{chat_id}#"
            },
            ScanIndexForward=False,
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
    
    if chat_title is None:
        chat_title = chat_uuid
    
    try:
        latest_chunk = get_latest_chunk(user_id, chat_uuid)
        
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
            chunk_index = 0
            sk = f"{chat_uuid}#0"
            messages = message_pair
            message_count = 2
        else:
            existing_messages = latest_chunk.get('messages', [])
            message_count = latest_chunk.get('messageCount', len(existing_messages))
            
            if message_count >= 400:
                chunk_index = latest_chunk.get('chunkIndex', 0) + 1
                sk = f"{chat_uuid}#{chunk_index}"
                messages = message_pair
                message_count = 2
                chat_title = latest_chunk.get('chatTitle', chat_uuid)
            else:
                chunk_index = latest_chunk.get('chunkIndex', 0)
                sk = f"{chat_uuid}#{chunk_index}"
                messages = existing_messages + message_pair
                message_count = len(messages)
                chat_title = latest_chunk.get('chatTitle', chat_uuid)
        
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

def handler(event, context):
    """Lambda handler function for sending voice messages"""
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
        
        audio_base64 = body.get('audio', '')
        audio_format = body.get('audioFormat', 'webm')
        response_format = body.get('responseFormat', 'voice')  # 'voice' or 'text'
        chat_id = body.get('chatId')
        chat_title = body.get('title')
        
        if not audio_base64:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Audio is required'})
            }
        
        if response_format not in ['voice', 'text']:
            response_format = 'voice'  # Default to voice
        
        # Decode audio
        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid audio encoding'})
            }
        
        # Transcribe audio to text
        transcript = transcribe_audio(audio_bytes, audio_format)
        
        if not transcript or not transcript.strip():
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Could not transcribe audio. Please try again.'})
            }
        
        # Generate chat_uuid if not provided
        if not chat_id:
            chat_uuid = uuid.uuid4().hex
        else:
            chat_uuid = chat_id
        
        # Detect sentiment
        sentiment = detect_sentiment(transcript)
        
        # Get recent chat history for context
        history = get_chat_history(user_id, chat_id=chat_uuid, limit=20)
        chat_history = [
            {
                'sender': item.get('sender'),
                'text': item.get('text')
            }
            for item in history
        ]
        
        # Generate AI response
        response_text = generate_response(transcript, sentiment, chat_history)
        
        # Save messages
        save_message(user_id, chat_uuid, transcript, response_text, sentiment, chat_title)
        
        # Prepare response
        response_data = {
            'transcript': transcript,
            'response': response_text,
            'sentiment': sentiment,
            'chatId': chat_uuid,
            'responseFormat': response_format
        }
        
        # Conditionally generate audio if voice format requested
        if response_format == 'voice':
            audio_base64_response = synthesize_speech(response_text)
            response_data['audio'] = audio_base64_response
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response_data)
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

