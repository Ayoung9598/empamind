variable "bucket_name" {
  description = "Name of the S3 bucket for Transcribe audio storage (must be globally unique)"
  type        = string

  validation {
    condition = (
      length(var.bucket_name) >= 3 &&
      length(var.bucket_name) <= 63 &&
      can(regex("^[a-z0-9][a-z0-9.-]*[a-z0-9]$", var.bucket_name))
    )
    error_message = "Bucket name must be 3-63 characters, lowercase alphanumeric with hyphens/periods, and not start/end with hyphen/period."
  }
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

