resource "aws_dynamodb_table" "chats" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "timestamp"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "chatId"
    type = "S"
  }

  # Global Secondary Index for querying messages by chatId
  global_secondary_index {
    name            = "chatId-index"
    hash_key        = "chatId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  tags = {
    Name        = var.table_name
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }
}

