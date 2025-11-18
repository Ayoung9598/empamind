output "send_message_arn" {
  description = "Send Message Lambda function ARN"
  value       = aws_lambda_function.send_message.arn
}

output "send_message_invoke_arn" {
  description = "Send Message Lambda invoke ARN for API Gateway"
  value       = aws_lambda_function.send_message.invoke_arn
}

output "send_message_name" {
  description = "Send Message Lambda function name"
  value       = aws_lambda_function.send_message.function_name
}

output "list_chats_arn" {
  description = "List Chats Lambda function ARN"
  value       = aws_lambda_function.list_chats.arn
}

output "list_chats_invoke_arn" {
  description = "List Chats Lambda invoke ARN for API Gateway"
  value       = aws_lambda_function.list_chats.invoke_arn
}

output "list_chats_name" {
  description = "List Chats Lambda function name"
  value       = aws_lambda_function.list_chats.function_name
}

output "get_chat_arn" {
  description = "Get Chat Lambda function ARN"
  value       = aws_lambda_function.get_chat.arn
}

output "get_chat_invoke_arn" {
  description = "Get Chat Lambda invoke ARN for API Gateway"
  value       = aws_lambda_function.get_chat.invoke_arn
}

output "get_chat_name" {
  description = "Get Chat Lambda function name"
  value       = aws_lambda_function.get_chat.function_name
}

