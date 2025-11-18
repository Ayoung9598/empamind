# API Gateway Module

This module creates an API Gateway REST API using a Swagger/OpenAPI specification file.

## Structure

- `api.yaml` - OpenAPI 3.0.1 specification defining all routes, integrations, and authorizers
- `main.tf` - Terraform resources that read and deploy the Swagger file
- `variables.tf` - Module input variables
- `outputs.tf` - Module outputs

## Swagger File

The `api.yaml` file uses placeholders that are replaced at deployment time:
- `${chat_handler_invoke_arn}` - Replaced with Chat Handler Lambda invoke ARN
- `${user_pool_arn}` - Replaced with Cognito User Pool ARN

## Endpoints

- `POST /chat` - Send chat message (requires Cognito auth)
  - Automatically performs sentiment analysis and includes it in the response
- `GET /chat/history` - Get chat history (requires Cognito auth)
- `OPTIONS /*` - CORS preflight for all endpoints

## Authorization

All endpoints (except OPTIONS) require Cognito JWT authentication via the `Authorization` header.

## CORS

CORS is configured to allow:
- Origins: `*` (all origins)
- Methods: `GET`, `POST`, `OPTIONS`
- Headers: `Content-Type`, `Authorization`

## Updating the API

To add/modify endpoints:
1. Edit `api.yaml` following OpenAPI 3.0.1 specification
2. Run `terraform plan` to see changes
3. Run `terraform apply` to deploy

The deployment will automatically update when the Swagger file changes.

