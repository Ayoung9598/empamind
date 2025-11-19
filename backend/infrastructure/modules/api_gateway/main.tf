# Data source for current AWS region
data "aws_region" "current" {}

# Use templatefile() to process Swagger file with variables
locals {
  swagger_body = templatefile("${path.module}/api.yaml", {
    send_message_invoke_arn = var.send_message_invoke_arn
    list_chats_invoke_arn   = var.list_chats_invoke_arn
    get_chat_invoke_arn     = var.get_chat_invoke_arn
    update_chat_invoke_arn  = var.update_chat_invoke_arn
    delete_chat_invoke_arn  = var.delete_chat_invoke_arn
    user_pool_arn           = var.user_pool_arn
  })
}

# API Gateway REST API (supports Swagger/OpenAPI)
resource "aws_api_gateway_rest_api" "main" {
  name        = "empamind-api-${var.environment}"
  description = "EmpaMind API Gateway"
  
  body = local.swagger_body

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "empamind-api"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }

  lifecycle {
    # Prevent recreation unless explicitly changed
    create_before_destroy = false
    # Ignore changes to body that don't affect functionality
    # This prevents unnecessary recreations when only Lambda ARNs change
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha256(local.swagger_body)
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_rest_api.main
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"

  # Enable CORS
  xray_tracing_enabled = false

  tags = {
    Name        = "prod"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "send_message" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.send_message_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "list_chats" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.list_chats_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_chat" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.get_chat_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "update_chat" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.update_chat_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete_chat" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.delete_chat_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

