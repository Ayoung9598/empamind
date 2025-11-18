# EmpaMind Backend - Terraform Infrastructure

This directory contains Terraform modules for deploying the EmpaMind backend infrastructure on AWS.

## Architecture

The infrastructure is organized into modules:

- **cognito**: Cognito User Pool for authentication
- **dynamodb**: DynamoDB table for chat history
- **lambda**: Lambda functions (Python with boto3)
- **api_gateway**: API Gateway with Cognito authorizer

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Python 3.11** and pip installed
4. **AWS Account** with Bedrock access enabled

## Quick Start

1. **Request Bedrock Access** (if not already done):
   - Go to AWS Console → Amazon Bedrock
   - Request access to `amazon.nova-micro-v1:0`

2. **Configure Terraform**:
   ```bash
   cd backend/infrastructure
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your preferences
   ```

3. **Initialize Terraform**:
   ```bash
   terraform init
   ```

4. **Review the plan**:
   ```bash
   terraform plan
   ```

5. **Apply the infrastructure**:
   ```bash
   terraform apply
   ```

6. **Note the outputs**:
   After deployment, Terraform will output:
   - `user_pool_id`
   - `user_pool_client_id`
   - `api_endpoint`
   - `chat_table_name`

7. **Update frontend `.env`** with these values

## Variables

See `variables.tf` for all available variables. Key variables:

- `aws_region`: AWS region (default: us-east-1)
- `environment`: Environment name (default: prod)
- `user_pool_name`: Cognito User Pool name
- `chat_table_name`: DynamoDB table name
- `bedrock_model_id`: Bedrock model ID

## Lambda Functions

Lambda functions are written in Python 3.11 using boto3:

- **chat-handler**: Main chat processing with Bedrock and Comprehend
- **sentiment-analyzer**: Standalone sentiment analysis endpoint

Dependencies are automatically installed during `terraform apply` via `null_resource` provisioners.

## Module Structure

```
terraform/
├── main.tf                 # Root module configuration
├── variables.tf            # Root variables
├── outputs.tf              # Root outputs
├── terraform.tfvars.example
└── modules/
    ├── cognito/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── dynamodb/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── lambda/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── api_gateway/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Updating Infrastructure

After making changes:

```bash
terraform plan    # Review changes
terraform apply   # Apply changes
```

## Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including DynamoDB data!

## Troubleshooting

### Lambda deployment fails
- Ensure Python 3.11 and pip are installed
- Check that `requirements.txt` files exist in Lambda directories
- Verify AWS credentials have Lambda permissions

### API Gateway authorizer issues
- Verify Cognito User Pool is created first
- Check JWT configuration matches User Pool settings

### Bedrock access denied
- Ensure Bedrock model access is requested and approved
- Verify IAM role has `bedrock:InvokeModel` permission

## Cost Considerations

All resources are designed to stay within AWS Free Tier:
- Lambda: 1M requests/month
- API Gateway: 1M requests/month
- DynamoDB: 25GB storage
- Comprehend: 50K characters/month
- Cognito: 50K MAU
- Bedrock: Pay-per-use (minimal for MVP)

