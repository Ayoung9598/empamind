# Lambda Layer for shared utilities
resource "aws_lambda_layer_version" "shared_utils" {
  filename            = data.archive_file.shared_utils_zip.output_path
  layer_name          = "empamind-shared-utils-${var.environment}"
  compatible_runtimes = ["python3.11"]
  source_code_hash    = data.archive_file.shared_utils_zip.output_base64sha256

  depends_on = [
    data.archive_file.shared_utils_zip
  ]
}

# Send Message Lambda function
resource "aws_lambda_function" "send_message" {
  filename         = data.archive_file.send_message_zip.output_path
  function_name    = "empamind-send-message-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "send_message.handler"
  runtime         = "python3.11"
  timeout         = 30
  memory_size     = 512

  source_code_hash = data.archive_file.send_message_zip.output_base64sha256

  layers = [aws_lambda_layer_version.shared_utils.arn]

  environment {
    variables = {
      CHAT_TABLE_NAME  = var.chat_table_name
      BEDROCK_MODEL_ID = var.bedrock_model_id
    }
  }

  tags = {
    Name        = "empamind-send-message"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_custom,
    aws_lambda_layer_version.shared_utils,
    data.archive_file.send_message_zip
  ]
}

# List Chats Lambda function
resource "aws_lambda_function" "list_chats" {
  filename         = data.archive_file.list_chats_zip.output_path
  function_name    = "empamind-list-chats-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "list_chats.handler"
  runtime         = "python3.11"
  timeout         = 15
  memory_size     = 256

  source_code_hash = data.archive_file.list_chats_zip.output_base64sha256

  layers = [aws_lambda_layer_version.shared_utils.arn]

  environment {
    variables = {
      CHAT_TABLE_NAME = var.chat_table_name
    }
  }

  tags = {
    Name        = "empamind-list-chats"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_custom,
    aws_lambda_layer_version.shared_utils,
    data.archive_file.list_chats_zip
  ]
}

# Get Chat Lambda function
resource "aws_lambda_function" "get_chat" {
  filename         = data.archive_file.get_chat_zip.output_path
  function_name    = "empamind-get-chat-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "get_chat.handler"
  runtime         = "python3.11"
  timeout         = 15
  memory_size     = 256

  source_code_hash = data.archive_file.get_chat_zip.output_base64sha256

  layers = [aws_lambda_layer_version.shared_utils.arn]

  environment {
    variables = {
      CHAT_TABLE_NAME = var.chat_table_name
    }
  }

  tags = {
    Name        = "empamind-get-chat"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_custom,
    aws_lambda_layer_version.shared_utils,
    data.archive_file.get_chat_zip
  ]
}

# Update Chat Lambda function
resource "aws_lambda_function" "update_chat" {
  filename         = data.archive_file.update_chat_zip.output_path
  function_name    = "empamind-update-chat-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "update_chat.handler"
  runtime         = "python3.11"
  timeout         = 15
  memory_size     = 256

  source_code_hash = data.archive_file.update_chat_zip.output_base64sha256

  layers = [aws_lambda_layer_version.shared_utils.arn]

  environment {
    variables = {
      CHAT_TABLE_NAME = var.chat_table_name
    }
  }

  tags = {
    Name        = "empamind-update-chat"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_custom,
    aws_lambda_layer_version.shared_utils,
    data.archive_file.update_chat_zip
  ]
}

# Delete Chat Lambda function
resource "aws_lambda_function" "delete_chat" {
  filename         = data.archive_file.delete_chat_zip.output_path
  function_name    = "empamind-delete-chat-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "delete_chat.handler"
  runtime         = "python3.11"
  timeout         = 15
  memory_size     = 256

  source_code_hash = data.archive_file.delete_chat_zip.output_base64sha256

  layers = [aws_lambda_layer_version.shared_utils.arn]

  environment {
    variables = {
      CHAT_TABLE_NAME = var.chat_table_name
    }
  }

  tags = {
    Name        = "empamind-delete-chat"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_custom,
    aws_lambda_layer_version.shared_utils,
    data.archive_file.delete_chat_zip
  ]
}

# Send Voice Message Lambda function
resource "aws_lambda_function" "send_voice_message" {
  filename         = data.archive_file.send_voice_message_zip.output_path
  function_name    = "empamind-send-voice-message-${var.environment}"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "send_voice_message.handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512

  source_code_hash = data.archive_file.send_voice_message_zip.output_base64sha256

  layers = [aws_lambda_layer_version.shared_utils.arn]

  environment {
    variables = {
      CHAT_TABLE_NAME        = var.chat_table_name
      BEDROCK_MODEL_ID      = var.bedrock_model_id
      TRANSCRIBE_BUCKET_NAME = var.transcribe_bucket_name
    }
  }

  tags = {
    Name        = "empamind-send-voice-message"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy.lambda_custom,
    aws_lambda_layer_version.shared_utils,
    data.archive_file.send_voice_message_zip
  ]
}

