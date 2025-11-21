variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.aws_region))
    error_message = "AWS region must be a valid region identifier."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "user_pool_name" {
  description = "Name for the Cognito User Pool"
  type        = string
  default     = "empamind-user-pool"
}

variable "chat_table_name" {
  description = "Name for the DynamoDB chat table"
  type        = string
  default     = "empamind-chats"
}

variable "bedrock_model_id" {
  description = "Bedrock model ID for Amazon Nova"
  type        = string
  default     = "amazon.nova-micro-v1:0"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state (must be globally unique)"
  type        = string
  default     = ""
}

variable "state_lock_table_name" {
  description = "Name of the DynamoDB table for Terraform state locking"
  type        = string
  default     = "empamind-terraform-state-lock"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend hosting (must be globally unique). Leave empty to skip frontend infrastructure."
  type        = string
  default     = ""

  validation {
    condition = var.frontend_bucket_name == "" || (
      length(var.frontend_bucket_name) >= 3 &&
      length(var.frontend_bucket_name) <= 63 &&
      can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.frontend_bucket_name))
    )
    error_message = "Bucket name must be 3-63 characters, lowercase alphanumeric with hyphens/periods, and not start/end with hyphen/period."
  }
}

variable "transcribe_bucket_name" {
  description = "Name of the S3 bucket for Transcribe temporary audio storage (optional, but required for voice features)."
  type        = string
  default     = ""
}

