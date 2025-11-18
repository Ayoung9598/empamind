# EmpaMind Quick Start Guide

Get EmpaMind up and running in 15 minutes!

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.0 installed (`terraform --version`)
- [ ] Python 3.11 installed (`python --version`)
- [ ] pip installed (`pip --version`)

## Step 1: Request Bedrock Access (2 minutes)

1. Log into AWS Console
2. Navigate to **Amazon Bedrock** service
3. Click **"Model access"** in left sidebar
4. Click **"Request model access"**
5. Select **"Amazon"** → **"Nova Micro"**
6. Click **"Request access"**
7. Access is usually granted immediately

## Step 2: Deploy Backend (5 minutes)

```bash
# Navigate to backend infrastructure
cd backend/infrastructure

# Copy and configure variables (optional)
cp terraform.tfvars.example terraform.tfvars

# Initialize Terraform
terraform init

# Review deployment plan
terraform plan

# Deploy infrastructure
terraform apply
```

**During deployment:**
- Type `yes` when prompted to confirm
- Wait for deployment to complete (5-10 minutes)

**After deployment, copy these outputs:**
- `user_pool_id`
- `user_pool_client_id`
- `api_endpoint`

## Step 3: Setup Frontend (3 minutes)

```bash
# Navigate to frontend
cd ../../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit `.env` file with your deployment outputs:**
```env
VITE_COGNITO_USER_POOL_ID=<paste UserPoolId>
VITE_COGNITO_USER_POOL_CLIENT_ID=<paste UserPoolClientId>
VITE_API_ENDPOINT=<paste ApiEndpoint>
VITE_AWS_REGION=us-east-1
```

## Step 4: Run Frontend (1 minute)

```bash
# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

## Step 5: Create Your First User (2 minutes)

1. Click **"Sign up"** on the login screen
2. Enter your email and password (min 8 chars, uppercase, lowercase, number)
3. Check your email for confirmation code
4. Enter confirmation code
5. You're in! Start chatting with EmpaMind

## Troubleshooting

### "Model access not granted"
- Go back to Step 1 and ensure Bedrock access is approved

### "Unauthorized" errors
- Check that your `.env` file has correct Cognito values
- Verify the API endpoint URL is correct

### Frontend won't start
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

### Lambda errors
- Check CloudWatch Logs for the Lambda function
- Verify Bedrock model access
- Check IAM permissions

## Next Steps

- Customize the system prompt in `backend/prompts/english-system-prompt.js`
- Adjust UI colors in `frontend/src/index.css`
- Add more features from the roadmap

## Need Help?

Check the detailed documentation:
- `README.md` - Full project overview
- `DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
- `backend/infrastructure/README.md` - Backend architecture

## Cost Estimate (Free Tier)

For MVP testing, you should stay within AWS Free Tier:
- Lambda: 1M requests/month ✅
- API Gateway: 1M requests/month ✅
- DynamoDB: 25GB storage ✅
- Comprehend: 50K characters/month ✅
- Cognito: 50K MAU ✅
- Bedrock: ~$0.25 per 1K input tokens (very minimal for testing)

**Estimated monthly cost for MVP: < $5**

