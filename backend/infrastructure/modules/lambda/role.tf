# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_execution" {
  name = "empamind-lambda-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "empamind-lambda-execution-role"
    Environment = var.environment
    createdby   = "ayomide.abiola@cecureintel.com"
  }
}

