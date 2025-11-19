resource "aws_dynamodb_table" "chats" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "sk"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "chatId"
    type = "S"
  }

  tags = {
    Name        = var.table_name
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }
}

