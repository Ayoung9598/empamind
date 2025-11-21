output "bucket_name" {
  description = "S3 bucket name for Transcribe audio storage"
  value       = aws_s3_bucket.transcribe.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.transcribe.arn
}

output "bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.transcribe.bucket_domain_name
}

