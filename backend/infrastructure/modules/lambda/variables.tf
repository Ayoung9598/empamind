variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "chat_table_name" {
  description = "DynamoDB chat table name"
  type        = string
}

variable "bedrock_model_id" {
  description = "Bedrock model ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

