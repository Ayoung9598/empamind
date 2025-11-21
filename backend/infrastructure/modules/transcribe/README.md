# Transcribe S3 Bucket Module

This module creates an S3 bucket for temporary audio storage used by AWS Transcribe for voice-to-voice chat features.

## Resources Created

1. **S3 Bucket** - Stores temporary audio files for transcription
   - Server-side encryption (AES256)
   - Public access blocked (private bucket)
   - Lifecycle policy to delete files after 1 day (automatic cleanup)

## Usage

```hcl
module "transcribe" {
  source = "./modules/transcribe"

  bucket_name = "empamind-transcribe-prod"
  environment = "prod"
}
```

## Variables

- `bucket_name` - Globally unique S3 bucket name
- `environment` - Environment name for tagging

## Outputs

- `bucket_name` - S3 bucket name (for Lambda environment variable)
- `bucket_arn` - S3 bucket ARN
- `bucket_domain_name` - S3 bucket domain name

## Deployment

After Terraform creates the bucket:

1. **Set GitHub Secret** (optional but recommended):
   - `TRANSCRIBE_BUCKET_NAME` = `bucket_name` output

2. **Lambda Configuration**:
   - The Lambda function will automatically use the bucket if `TRANSCRIBE_BUCKET_NAME` environment variable is set

## Cost

- **S3**: Free tier (5GB storage, 20K GET requests/month)
- Files are automatically deleted after 1 day, keeping costs minimal

