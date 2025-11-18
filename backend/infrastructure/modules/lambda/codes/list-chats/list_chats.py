import json

# Import from Lambda layer (mounted at /opt/python)
from utils import get_user_id, get_cors_headers, list_chats

def handler(event, context):
    """Lambda handler function for listing all chats"""
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
        chats = list_chats(user_id)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'chats': chats})
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

