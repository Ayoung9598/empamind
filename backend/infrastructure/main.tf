terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # Uncomment and configure if using remote state
  # backend "s3" {
  #   bucket = "terraform-state-bucket"
  #   key    = "empamind/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "EmpaMind"
      Environment = var.environment
      ManagedBy   = "Terraform"
      createdby   = "ayomide.abiola@cecureintel.com"
    }
  }
}

# Data source for current AWS region
data "aws_region" "current" {}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Module for Terraform State Storage (S3 + DynamoDB)
# Note: This should be created first, before enabling remote state backend
module "state" {
  count = var.state_bucket_name != "" ? 1 : 0

  source = "./modules/state"

  state_bucket_name    = var.state_bucket_name
  state_lock_table_name = var.state_lock_table_name
  environment          = var.environment
}

# Module for Cognito User Pool
module "cognito" {
  source = "./modules/cognito"

  user_pool_name = var.user_pool_name
  environment    = var.environment
}

# Module for DynamoDB
module "dynamodb" {
  source = "./modules/dynamodb"

  table_name  = var.chat_table_name
  environment = var.environment
}

# Module for Lambda functions
module "lambda" {
  source = "./modules/lambda"

  aws_region        = var.aws_region
  chat_table_name   = module.dynamodb.table_name
  bedrock_model_id  = var.bedrock_model_id
  environment       = var.environment

  depends_on = [
    module.dynamodb
  ]
}

# Module for API Gateway
module "api_gateway" {
  source = "./modules/api_gateway"

  user_pool_arn          = module.cognito.user_pool_arn
  user_pool_id           = module.cognito.user_pool_id
  user_pool_client_id    = module.cognito.user_pool_client_id
  send_message_invoke_arn = module.lambda.send_message_invoke_arn
  send_message_name       = module.lambda.send_message_name
  list_chats_invoke_arn   = module.lambda.list_chats_invoke_arn
  list_chats_name         = module.lambda.list_chats_name
  get_chat_invoke_arn     = module.lambda.get_chat_invoke_arn
  get_chat_name           = module.lambda.get_chat_name
  environment             = var.environment

  depends_on = [
    module.cognito,
    module.lambda
  ]
}

# Module for Frontend Hosting (S3 + CloudFront)
module "frontend" {
  count = var.frontend_bucket_name != "" ? 1 : 0

  source = "./modules/frontend"

  bucket_name = var.frontend_bucket_name
  environment = var.environment
}

