# S3 Bucket for Transcribe (temporary audio storage)
resource "aws_s3_bucket" "transcribe" {
  bucket = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    Purpose     = "Transcribe Audio Storage"
    ManagedBy   = "Terraform"
    createdby   = "ayomide.abiola@cecureintel.com"
  }
}

# Block public access for Transcribe bucket
resource "aws_s3_bucket_public_access_block" "transcribe" {
  bucket = aws_s3_bucket.transcribe.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption for Transcribe bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "transcribe" {
  bucket = aws_s3_bucket.transcribe.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy - delete old transcription files after 1 day
resource "aws_s3_bucket_lifecycle_configuration" "transcribe" {
  bucket = aws_s3_bucket.transcribe.id

  rule {
    id     = "delete-old-transcriptions"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}

