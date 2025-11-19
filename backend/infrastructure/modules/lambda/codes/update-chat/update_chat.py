import json
import os
import boto3
from botocore.exceptions import ClientError

# Import from Lambda layer (mounted at /opt/python)
from utils import get_user_id, get_cors_headers

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
TABLE_NAME = os.environ.get('CHAT_TABLE_NAME', 'empamind-chats')

def handler(event, context):
    """Lambda handler function for updating chat title"""
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
        
        body = json.loads(event.get('body', '{}'))
        new_title = body.get('title', '').strip()
        
        if not new_title:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'title is required'})
            }
        
        table = dynamodb.Table(TABLE_NAME)
        
        # Query all chunks for this chat
        all_chunks = []
        query_params = {
            'KeyConditionExpression': 'userId = :userId AND begins_with(sk, :chatPrefix)',
            'ExpressionAttributeValues': {
                ':userId': user_id,
                ':chatPrefix': f"{chat_id}#"
            }
        }
        
        # Get all chunks
        while True:
            response = table.query(**query_params)
            chunks = response.get('Items', [])
            all_chunks.extend(chunks)
            
            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break
            
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        if not all_chunks:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Chat not found'})
            }
        
        # Validate ownership (check first chunk's userId)
        if all_chunks[0].get('userId') != user_id:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Forbidden: You do not own this chat'})
            }
        
        # Update chatTitle in all chunks
        for chunk in all_chunks:
            table.update_item(
                Key={
                    'userId': chunk['userId'],
                    'sk': chunk['sk']
                },
                UpdateExpression='SET chatTitle = :title',
                ExpressionAttributeValues={
                    ':title': new_title
                }
            )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Chat title updated successfully',
                'chatId': chat_id,
                'title': new_title
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

