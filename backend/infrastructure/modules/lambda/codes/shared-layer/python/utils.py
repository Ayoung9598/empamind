import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
TABLE_NAME = os.environ.get('CHAT_TABLE_NAME', 'empamind-chats')

def get_user_id(event):
    """Extract user ID from Cognito authorizer"""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    claims = authorizer.get('jwt', {}).get('claims', {}) or authorizer.get('claims', {})
    return claims.get('sub') or authorizer.get('principalId') or 'anonymous'

def get_cors_headers():
    """Get CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }

def get_chat_history(user_id, chat_id, limit=100, max_limit=1000):
    """Get chat history for a specific chat from DynamoDB with pagination support
    
    Args:
        user_id: User ID (for validation/security)
        chat_id: Required chat ID for specific chat
        limit: Number of messages to fetch (default: 100, max: 1000)
        max_limit: Maximum allowed limit for safety (default: 1000)
    
    Returns:
        List of message items from DynamoDB for the specified chat
    
    Raises:
        ValueError: If chat_id is not provided
    """
    if not chat_id:
        raise ValueError("chat_id is required to get chat history")
    
    # Enforce maximum limit for safety
    limit = min(limit, max_limit)
    
    table = dynamodb.Table(TABLE_NAME)
    all_items = []
    
    try:
        # Get messages for a specific chat using GSI
        query_params = {
            'IndexName': 'chatId-index',
            'KeyConditionExpression': 'chatId = :chatId',
            'ExpressionAttributeValues': {
                ':chatId': chat_id
            },
            'ScanIndexForward': True,  # Oldest first for conversation flow
            'Limit': limit
        }
        
        # Paginate through results up to limit
        while True:
            response = table.query(**query_params)
            items = response.get('Items', [])
            all_items.extend(items)
            
            # Check if we've reached the limit
            if len(all_items) >= limit:
                all_items = all_items[:limit]
                break
            
            # Check if there are more items
            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break
            
            # Continue with next page
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        return all_items
    except ClientError as e:
        print(f'Error fetching chat history: {e}')
        return []

def list_chats(user_id, batch_size=20, max_batches=50):
    """List all chat sessions for a user with efficient pagination
    
    Args:
        user_id: User ID
        batch_size: Number of messages to fetch per batch (default: 20)
        max_batches: Maximum number of batches to process (default: 50 = 1000 messages max)
                     This prevents unbounded queries while allowing proper chat grouping
    
    Returns:
        List of chat sessions with metadata, sorted by last message time (most recent first)
    """
    table = dynamodb.Table(TABLE_NAME)
    chats_dict = {}
    batch_count = 0
    
    try:
        # Paginate through messages for user in small batches
        query_params = {
            'KeyConditionExpression': 'userId = :userId',
            'ExpressionAttributeValues': {
                ':userId': user_id
            },
            'ScanIndexForward': False,  # Most recent first
            'Limit': batch_size
        }
        
        # Process batches until we've seen enough or run out of messages
        while batch_count < max_batches:
            response = table.query(**query_params)
            items = response.get('Items', [])
            
            if not items:
                break
            
            # Process this batch and update chat metadata
            for item in items:
                chat_id = item.get('chatId')
                if not chat_id:
                    continue
                
                if chat_id not in chats_dict:
                    # First time seeing this chat - initialize
                    chats_dict[chat_id] = {
                        'chatId': chat_id,
                        'title': item.get('chatTitle', 'Untitled Chat'),
                        'lastMessageTime': item.get('timestamp'),
                        'createdAt': item.get('timestamp')
                    }
                else:
                    # Update existing chat metadata
                    # Update earliest timestamp (creation time)
                    if item.get('timestamp') < chats_dict[chat_id].get('createdAt', item.get('timestamp')):
                        chats_dict[chat_id]['createdAt'] = item.get('timestamp')
                    # Update last message time if this is more recent
                    if item.get('timestamp') > chats_dict[chat_id].get('lastMessageTime', ''):
                        chats_dict[chat_id]['lastMessageTime'] = item.get('timestamp')
            
            batch_count += 1
            
            # Check if there are more items
            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break
            
            # Continue with next page
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        if batch_count >= max_batches:
            print(f'Info: Processed {max_batches} batches ({batch_count * batch_size} messages) for user {user_id}')
        
        # Convert to list and sort by last message time
        chats = list(chats_dict.values())
        chats.sort(key=lambda x: x.get('lastMessageTime', ''), reverse=True)
        
        return chats
    except ClientError as e:
        print(f'Error listing chats: {e}')
        return []

