output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "chat_table_name" {
  description = "DynamoDB Chat Table Name"
  value       = module.dynamodb.table_name
}


# Frontend Hosting Outputs
output "frontend_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  value       = var.frontend_bucket_name != "" ? module.frontend[0].bucket_name : null
}

output "frontend_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for frontend"
  value       = var.frontend_bucket_name != "" ? module.frontend[0].cloudfront_distribution_id : null
}

output "frontend_cloudfront_url" {
  description = "CloudFront URL for frontend (use this as your frontend URL)"
  value       = var.frontend_bucket_name != "" ? module.frontend[0].cloudfront_url : null
}

# Transcribe Bucket Output
output "transcribe_bucket_name" {
  description = "S3 bucket name for Transcribe audio storage"
  value       = module.transcribe.bucket_name
}

