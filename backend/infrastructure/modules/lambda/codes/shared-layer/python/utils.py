import os
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
TABLE_NAME = os.environ.get('CHAT_TABLE_NAME', 'empamind-chats')

def get_user_id(event):
    """Extract user ID from Cognito authorizer and prefix with 'user_'"""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    claims = authorizer.get('jwt', {}).get('claims', {}) or authorizer.get('claims', {})
    raw_user_id = claims.get('sub') or authorizer.get('principalId') or 'anonymous'
    # Prefix with 'user_' if not already prefixed
    if raw_user_id.startswith('user_'):
        return raw_user_id
    return f"user_{raw_user_id}"

def get_cors_headers():
    """Get CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
        List of individual message items from all chunks, sorted chronologically
    
    Raises:
        ValueError: If chat_id is not provided
    """
    if not chat_id:
        raise ValueError("chat_id is required to get chat history")
    
    # Enforce maximum limit for safety
    limit = min(limit, max_limit)
    
    table = dynamodb.Table(TABLE_NAME)
    all_chunks = []
    
    try:
        # Query all chunks for this chat using main table
        query_params = {
            'KeyConditionExpression': 'userId = :userId AND begins_with(sk, :chatPrefix)',
            'ExpressionAttributeValues': {
                ':userId': user_id,
                ':chatPrefix': f"{chat_id}#"
            },
            'ScanIndexForward': True  # Ascending order (chatId#0, chatId#1, ...)
        }
        
        # Get all chunks
        while True:
            response = table.query(**query_params)
            chunks = response.get('Items', [])
            all_chunks.extend(chunks)
            
            # Check if there are more items
            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break
            
            # Continue with next page
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        # Merge all messages from all chunks
        all_messages = []
        for chunk in all_chunks:
            messages = chunk.get('messages', [])
            all_messages.extend(messages)
        
        # Sort by timestamp to ensure chronological order
        all_messages.sort(key=lambda x: x.get('timestamp', ''))
        
        # Apply limit
        if len(all_messages) > limit:
            all_messages = all_messages[:limit]
        
        return all_messages
    except ClientError as e:
        print(f'Error fetching chat history: {e}')
        return []

def list_chats(user_id, batch_size=20, max_batches=50):
    """List all chat sessions for a user with efficient pagination
    
    Args:
        user_id: User ID (prefixed with 'user_')
        batch_size: Number of chunks to fetch per batch (default: 20)
        max_batches: Maximum number of batches to process (default: 50)
    
    Returns:
        List of chat sessions with metadata, sorted by last message time (most recent first)
    """
    table = dynamodb.Table(TABLE_NAME)
    chats_dict = {}
    batch_count = 0
    
    try:
        # Query all chunks for user
        query_params = {
            'KeyConditionExpression': 'userId = :userId',
            'ExpressionAttributeValues': {
                ':userId': user_id
            },
            'ScanIndexForward': False,  # Most recent first
            'Limit': batch_size
        }
        
        # Process batches until we've seen enough or run out of chunks
        while batch_count < max_batches:
            response = table.query(**query_params)
            chunks = response.get('Items', [])
            
            if not chunks:
                break
            
            # Process this batch and update chat metadata
            for chunk in chunks:
                chat_id = chunk.get('chatId')
                if not chat_id:
                    continue
                
                chunk_index = chunk.get('chunkIndex', 0)
                chunk_timestamp = chunk.get('timestamp', '')
                chat_title = chunk.get('chatTitle', chat_id)
                
                if chat_id not in chats_dict:
                    # First time seeing this chat - initialize
                    chats_dict[chat_id] = {
                        'chatId': chat_id,
                        'title': chat_title,
                        'lastMessageTime': chunk_timestamp,
                        'createdAt': chunk_timestamp,
                        'maxChunkIndex': chunk_index
                    }
                else:
                    # Update existing chat metadata
                    # Track highest chunk index to get latest chunk info
                    if chunk_index > chats_dict[chat_id].get('maxChunkIndex', -1):
                        chats_dict[chat_id]['maxChunkIndex'] = chunk_index
                        # Update title and timestamp from latest chunk
                        chats_dict[chat_id]['title'] = chat_title
                        chats_dict[chat_id]['lastMessageTime'] = chunk_timestamp
                    # Update earliest timestamp (creation time) - should be from chunk 0
                    if chunk_index == 0 and chunk_timestamp < chats_dict[chat_id].get('createdAt', chunk_timestamp):
                        chats_dict[chat_id]['createdAt'] = chunk_timestamp
            
            batch_count += 1
            
            # Check if there are more items
            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break
            
            # Continue with next page
            query_params['ExclusiveStartKey'] = last_evaluated_key
        
        if batch_count >= max_batches:
            print(f'Info: Processed {max_batches} batches for user {user_id}')
        
        # Convert to list and sort by last message time
        chats = list(chats_dict.values())
        chats.sort(key=lambda x: x.get('lastMessageTime', ''), reverse=True)
        
        # Remove internal tracking field
        for chat in chats:
            chat.pop('maxChunkIndex', None)
        
        return chats
    except ClientError as e:
        print(f'Error listing chats: {e}')
        return []

