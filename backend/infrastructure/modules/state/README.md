# Terraform State Storage Module

This module creates the S3 bucket and DynamoDB table for storing Terraform state remotely.

## Resources Created

1. **S3 Bucket** - Stores Terraform state files
   - Versioning enabled (for state history)
   - Server-side encryption (AES256)
   - Public access blocked
   - Lifecycle rule to delete old versions after 90 days

2. **DynamoDB Table** - State locking to prevent concurrent modifications
   - Pay-per-request billing
   - LockID as hash key

## Usage

1. First, create the state bucket with local state:
   ```bash
   terraform apply -target=module.state
   ```

2. Then configure the backend in `state-backend.tf`:
   ```hcl
   terraform {
     backend "s3" {
       bucket         = "your-empamind-terraform-state"
       key            = "empamind/terraform.tfstate"
       region         = "us-east-1"
       encrypt        = true
       dynamodb_table = "empamind-terraform-state-lock"
     }
   }
   ```

3. Migrate existing state:
   ```bash
   terraform init -migrate-state
   ```

## Variables

- `state_bucket_name` - Globally unique S3 bucket name
- `state_lock_table_name` - DynamoDB table name for locking
- `environment` - Environment name for tagging

## Outputs

- `state_bucket_name` - S3 bucket name
- `state_bucket_arn` - S3 bucket ARN
- `state_lock_table_name` - DynamoDB table name
- `state_lock_table_arn` - DynamoDB table ARN

