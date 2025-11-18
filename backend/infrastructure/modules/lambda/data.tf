# Archive files for Lambda deployment

# Shared utils layer - Lambda layers need python/ directory structure
data "archive_file" "shared_utils_zip" {
  type        = "zip"
  source_dir  = "${path.module}/codes/shared-layer"
  output_path = "${path.module}/codes/shared-utils.zip"
  excludes    = ["__pycache__", "*.pyc", ".pytest_cache", "*.zip", "*.md"]
}

# Send message handler
data "archive_file" "send_message_zip" {
  type        = "zip"
  source_dir  = "${path.module}/codes/send-message"
  output_path = "${path.module}/codes/send-message.zip"
  excludes    = ["__pycache__", "*.pyc", ".pytest_cache", "*.zip", "*.md"]
}

# List chats handler
data "archive_file" "list_chats_zip" {
  type        = "zip"
  source_dir  = "${path.module}/codes/list-chats"
  output_path = "${path.module}/codes/list-chats.zip"
  excludes    = ["__pycache__", "*.pyc", ".pytest_cache", "*.zip", "*.md"]
}

# Get chat handler
data "archive_file" "get_chat_zip" {
  type        = "zip"
  source_dir  = "${path.module}/codes/get-chat"
  output_path = "${path.module}/codes/get-chat.zip"
  excludes    = ["__pycache__", "*.pyc", ".pytest_cache", "*.zip", "*.md"]
}

