variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "send_message_invoke_arn" {
  description = "Send Message Lambda invoke ARN for API Gateway"
  type        = string
}

variable "send_message_name" {
  description = "Send Message Lambda function name"
  type        = string
}

variable "list_chats_invoke_arn" {
  description = "List Chats Lambda invoke ARN for API Gateway"
  type        = string
}

variable "list_chats_name" {
  description = "List Chats Lambda function name"
  type        = string
}

variable "get_chat_invoke_arn" {
  description = "Get Chat Lambda invoke ARN for API Gateway"
  type        = string
}

variable "get_chat_name" {
  description = "Get Chat Lambda function name"
  type        = string
}

variable "update_chat_invoke_arn" {
  description = "Update Chat Lambda invoke ARN for API Gateway"
  type        = string
}

variable "update_chat_name" {
  description = "Update Chat Lambda function name"
  type        = string
}

variable "delete_chat_invoke_arn" {
  description = "Delete Chat Lambda invoke ARN for API Gateway"
  type        = string
}

variable "delete_chat_name" {
  description = "Delete Chat Lambda function name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "user_pool_client_id" {
  description = "Cognito User Pool Client ID (for JWT authorizer)"
  type        = string
}

variable "send_voice_message_invoke_arn" {
  description = "Send Voice Message Lambda invoke ARN for API Gateway"
  type        = string
}

variable "send_voice_message_name" {
  description = "Send Voice Message Lambda function name"
  type        = string
}

