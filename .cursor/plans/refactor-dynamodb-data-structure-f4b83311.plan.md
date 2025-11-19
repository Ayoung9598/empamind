<!-- f4b83311-3ea8-4117-aa8a-2d9a1dd97269 43039f0a-0d7d-43e6-872b-384b7e0884bf -->
# Refactor DynamoDB to Single List Records with Chunking

## Overview

Restructure DynamoDB storage to use single list records per chat with chunking when needed. This approach is 50-100x more cost-effective for reads compared to individual records. Also add PUT and DELETE endpoints for chat management.

## Why Single List Record with Chunking?

**Cost Comparison (100 message pairs):**

- **Individual records**: 100 RCU to read, 100 operations to update/delete
- **Single list record**: 1-2 RCU to read, 1-2 operations to update/delete
- **Savings**: 50-100x cheaper for reads, 50-100x cheaper for updates/deletes

**Benefits:**

- Much more cost-effective (especially reads)
- Better write efficiency (1-2 operations per message)
- Simpler updates/deletes
- Most chats fit in 1 record (<200 message pairs)
- Chunking only needed for very long chats

## Changes Required

### 1. User ID Format

- **File**: `backend/infrastructure/modules/lambda/codes/shared-layer/python/utils.py`
- Change `get_user_id()` to return `f"user_{user_id}"` instead of raw ID
- Update all places where user_id is used to expect the prefixed format

### 2. Chat ID Generation (chat_uuid)

- **File**: `backend/infrastructure/modules/lambda/codes/send-message/send_message.py`
- Replace `f"{user_id}-{timestamp}"` with `chat_uuid = uuid.uuid4().hex`
- Variable name: `chat_uuid` in code
- Store in `chatId` field in DynamoDB (for GSI compatibility)
- Access control: Filter by PK=userId to ensure users only access their chats

### 3. Single List Record per Chat (with Chunking)

- **File**: `backend/infrastructure/modules/lambda/codes/send-message/send_message.py`
- **Current**: Two separate records per message pair (user + AI)
- **New**: Single record per chat with `messages[]` array containing all messages
- **Chunking**: When record approaches 400KB (~200 message pairs), create new chunk
- Structure:
  ```python
  {
    'userId': 'user_123',
    'chatId': 'chat_uuid',
    'chunkIndex': 0,  # 0, 1, 2... for chunking
    'timestamp': 'iso-timestamp',  # Creation/update time
    'messages': [
      {'sender': 'user', 'text': '...', 'sentiment': '...', 'timestamp': '...'},
      {'sender': 'ai', 'text': '...', 'timestamp': '...'},
      # ... all messages in this chunk (up to ~200 message pairs)
    ],
    'chatTitle': 'chat_uuid',  # Default, editable
    'messageCount': 200  # Track messages in this chunk
  }
  ```


### 4. Chunking Logic Implementation

- **File**: `backend/infrastructure/modules/lambda/codes/send-message/send_message.py`
- **Function**: `save_message()`
- **Logic**:

  1. If new chat: Create chunk 0 with first message pair
  2. If existing chat: Query latest chunk using GSI (chatId-index, sort by chunkIndex DESC, limit 1)
  3. Check if latest chunk has space:

     - If `messageCount < 200` AND estimated size < 350KB: Append to latest chunk (read-modify-write)
     - If chunk is full: Create new chunk with `chunkIndex = lastChunkIndex + 1`

  1. Size estimation: ~1.5-2KB per message pair, so 200 pairs ≈ 300-400KB (safe margin)

### 5. Update Chat History Retrieval

- **File**: `backend/infrastructure/modules/lambda/codes/shared-layer/python/utils.py`
- **Function**: `get_chat_history()`
- Query all chunks for chatId using GSI (chatId-index)
- Sort chunks by `chunkIndex` (0, 1, 2... ascending)
- Merge all `messages[]` arrays from chunks into single chronological list
- Return flattened list of individual messages
- Handle case where chat fits in single chunk (no merging needed)

### 6. Update List Chats Function

- **File**: `backend/infrastructure/modules/lambda/codes/shared-layer/python/utils.py`
- **Function**: `list_chats()`
- Query by `userId` (now prefixed with "user_")
- For each unique `chatId`, get latest chunk (highest chunkIndex) to get `chatTitle` and `timestamp`
- Group by `chatId`, return list with latest `timestamp` and `chatTitle`
- Use `chat_uuid` as default title if `chatTitle` not set

### 7. Chat Title Handling

- **File**: `backend/infrastructure/modules/lambda/codes/send-message/send_message.py`
- Default `chatTitle` to `chat_uuid` (UUID string)
- Only set custom title on first message of new chat
- Subsequent messages in same chat keep existing title (read from latest chunk)

### 8. NEW: Update Chat API (PUT)

- **Endpoint**: `PUT /chat/{chatId}`
- **Lambda**: `update-chat` function
- **Purpose**: Update chat title
- **Request Body**: `{ "title": "New Chat Title" }`
- **Implementation**:

  1. Query all chunks for chatId using GSI
  2. Validate userId ownership (check first chunk's userId)
  3. Update `chatTitle` in all chunks using batch writes (BatchWriteItem)
  4. Return success response

- **File**: `backend/infrastructure/modules/lambda/codes/update-chat/update_chat.py` (NEW)

### 9. NEW: Delete Chat API

- **Endpoint**: `DELETE /chat/{chatId}`
- **Lamb

### To-dos

- [ ] Update get_user_id() to prefix userId with 'user_' in utils.py
- [ ] Change chat_id generation from timestamp-based to UUID in send_message.py
- [ ] Refactor save_message() to store combined user+AI messages in single record with messages array
- [ ] Implement chunking logic in save_message() - create new chunks when limit reached (~100 message pairs)
- [ ] Update get_chat_history() to query and merge all chunks for a chatId
- [ ] Update chat title logic to default to chatId instead of first message
- [ ] Update list_chats() to work with new userId prefix and chunked structure