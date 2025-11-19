import json

# Import from Lambda layer (mounted at /opt/python)
from utils import get_user_id, get_cors_headers, get_chat_history

def handler(event, context):
    """Lambda handler function for getting messages in a specific chat"""
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
        path_params = event.get('pathParameters') or {}
        chat_id = path_params.get('chatId')
        
        if not chat_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'chatId is required'})
            }
        
        # Get all messages for the chat (up to max limit of 1000)
        # get_chat_history now returns flattened list of messages from all chunks
        history = get_chat_history(user_id, chat_id=chat_id, limit=1000)
        messages = [
            {
                'id': f"{item.get('timestamp', '')}-{item.get('sender', '')}",  # Generate ID from timestamp and sender
                'text': item.get('text', ''),
                'sender': item.get('sender', ''),
                'timestamp': item.get('timestamp', ''),
                'sentiment': item.get('sentiment')  # May not exist for AI messages
            }
            for item in history
        ]
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'messages': messages})
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

