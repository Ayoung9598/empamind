# EmpaMind Deployment Checklist & Steps

## ✅ Setup Verification

Everything is fully configured and ready for deployment!

### Infrastructure Modules ✅
- ✅ **Cognito** - User authentication
- ✅ **DynamoDB** - Chat storage
- ✅ **Lambda** - Backend functions (send-message, list-chats, get-chat)
- ✅ **API Gateway** - REST API with Cognito auth
- ✅ **Frontend** - S3 + CloudFront hosting (NEW!)
- ✅ **State** - Optional Terraform state storage

### CI/CD ✅
- ✅ GitHub Actions workflow configured
- ✅ Automated backend deployment
- ✅ Automated frontend deployment
- ✅ Supports S3+CloudFront deployment

### Code ✅
- ✅ Frontend React app with Vite
- ✅ Backend Lambda functions
- ✅ Terraform infrastructure as code

---

## 🚀 Deployment Steps

### Prerequisites (One-Time Setup)

1. **AWS Account Setup**
   ```bash
   # Install AWS CLI
   aws --version  # Should show version
   
   # Configure AWS credentials
   aws configure
   # Enter: Access Key ID, Secret Key, Region (us-east-1), Output (json)
   
   # Verify
   aws sts get-caller-identity
   ```

2. **Request Bedrock Access** (2 minutes)
   - Go to AWS Console → Amazon Bedrock
   - Click "Model access" → "Request model access"
   - Select: `amazon.nova-micro-v1:0`
   - Click "Request access" (usually instant)

3. **Set Up Billing Alerts** (Recommended)
   - Go to AWS Billing Console
   - Create a billing alarm
   - Set threshold (e.g., $10/month for MVP)
   - Configure SNS notifications

4. **Install Tools**
   ```bash
   # Terraform
   terraform --version  # Should be >= 1.0
   
   # Node.js
   node --version  # Should be >= 18
   npm --version
   ```

---

## Step 1: Deploy Backend Infrastructure (10 minutes)

### 1.1 Configure Terraform

```bash
cd backend/infrastructure

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars (optional - defaults work fine)
# Add frontend bucket name if you want S3+CloudFront:
```

Edit `terraform.tfvars`:
```hcl
aws_region = "us-east-1"
environment = "prod"

# Optional: Frontend hosting (recommended for full AWS stack)
frontend_bucket_name = "empamind-frontend-prod"  # Must be globally unique!

# Optional: State bucket (recommended for production)
# state_bucket_name = "empamind-terraform-state"
# state_lock_table_name = "empamind-terraform-lock"

# Optional: Custom names
# user_pool_name = "empamind-users"
# chat_table_name = "empamind-chats"
# bedrock_model_id = "amazon.nova-micro-v1:0"
```

### 1.2 Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Deploy (type 'yes' when prompted)
terraform apply
```

**Expected Output:**
```
Apply complete! Resources: X added, 0 changed, 0 destroyed.

Outputs:

user_pool_id = "us-east-1_XXXXXXXXX"
user_pool_client_id = "xxxxxxxxxxxxxxxxxxxxxx"
api_endpoint = "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod"
chat_table_name = "empamind-chats"
frontend_bucket_name = "empamind-frontend-prod"
frontend_cloudfront_distribution_id = "EXXXXXXXXXXXXX"
frontend_cloudfront_url = "https://dxxxxxxxxxxxxx.cloudfront.net"
```

### 1.3 Save Outputs

**Copy these values** - you'll need them for GitHub Secrets:

```bash
terraform output
```

Save:
- `user_pool_id`
- `user_pool_client_id`
- `api_endpoint`
- `frontend_bucket_name` (if you set it)
- `frontend_cloudfront_distribution_id` (if you set it)
- `frontend_cloudfront_url` (if you set it)

---

## Step 2: Configure GitHub Secrets (5 minutes)

Go to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets:

1. **AWS_ACCESS_KEY_ID**
   - Your AWS access key ID

2. **AWS_SECRET_ACCESS_KEY**
   - Your AWS secret access key

3. **VITE_COGNITO_USER_POOL_ID**
   - From `terraform output user_pool_id`

4. **VITE_COGNITO_USER_POOL_CLIENT_ID**
   - From `terraform output user_pool_client_id`

5. **VITE_API_ENDPOINT**
   - From `terraform output api_endpoint`

### Frontend Deployment Secrets (Choose ONE option):

#### Option A: S3 + CloudFront (Recommended - Full AWS Stack) ✅

6. **S3_BUCKET_NAME**
   - From `terraform output frontend_bucket_name`

7. **CLOUDFRONT_DIST_ID** (Optional - for cache invalidation)
   - From `terraform output frontend_cloudfront_distribution_id`

#### Option B: Vercel

6. **VERCEL_TOKEN**
7. **VERCEL_ORG_ID**
8. **VERCEL_PROJECT_ID**

#### Option C: Netlify

6. **NETLIFY_AUTH_TOKEN**
7. **NETLIFY_SITE_ID**

---

## Step 3: Deploy via GitHub Actions (Automatic!)

### 3.1 Push to Main Branch

```bash
# Make sure you're on main branch
git checkout main

# Add and commit any changes
git add .
git commit -m "Initial deployment setup"

# Push to trigger deployment
git push origin main
```

### 3.2 Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch the deployment progress:
   - ✅ Backend deployment (Terraform)
   - ✅ Frontend build
   - ✅ Frontend deployment

### 3.3 Verify Deployment

After deployment completes:

**Backend:**
```bash
# Test API endpoint
curl https://YOUR_API_ENDPOINT/chats
# Should return 401 (unauthorized - expected without auth token)
```

**Frontend:**
- If using S3+CloudFront: Visit `frontend_cloudfront_url` from terraform output
- If using Vercel/Netlify: Check your deployment dashboard

---

## Step 4: Test the Application

### 4.1 Create User Account

1. Open your frontend URL
2. Click "Sign up"
3. Enter email and password (min 8 chars, uppercase, lowercase, number)
4. Check email for confirmation code
5. Enter confirmation code
6. Sign in

### 4.2 Test Chat

1. Send a test message
2. Verify AI response
3. Check chat history loads

---

## 🎉 You're Live!

Your EmpaMind application is now fully deployed on AWS!

### Access Points:
- **Frontend**: CloudFront URL (or Vercel/Netlify URL)
- **API**: API Gateway endpoint
- **AWS Console**: Monitor resources in AWS

### Next Steps:
- Set up custom domain (optional)
- Configure CloudWatch monitoring
- Set up billing alerts
- Review security settings

---

## Troubleshooting

### Backend Deployment Fails
- Check AWS credentials are correct
- Verify Bedrock model access is granted
- Check Terraform logs in GitHub Actions

### Frontend Deployment Fails
- Verify all GitHub secrets are set
- Check S3 bucket name is correct (if using S3)
- Review build logs in GitHub Actions

### Authentication Issues
- Verify Cognito User Pool ID and Client ID are correct
- Check email verification settings in Cognito console

### API Errors
- Check API Gateway logs
- Verify Lambda function logs in CloudWatch
- Ensure Bedrock access is granted

### CORS Issues
- Verify CORS is configured in API Gateway
- Check API Gateway CORS settings in console
- Ensure frontend URL is in allowed origins

### Lambda Deployment Issues
- Ensure Python 3.11 and pip are installed
- Check that `__pycache__` and `.pyc` files are excluded
- Verify `requirements.txt` doesn't include unnecessary packages

---

## Cost Estimate

**AWS Free Tier (First 12 months):**
- Lambda: 1M requests/month ✅
- API Gateway: 1M requests/month ✅
- DynamoDB: 25GB storage ✅
- Cognito: 50K MAU ✅
- S3: 5GB storage, 20K GET requests ✅
- CloudFront: 50GB transfer, 2M requests ✅

**Expected Monthly Cost: $0-5** for MVP

---

## Updating Infrastructure

After making changes to Lambda functions or infrastructure:

```bash
cd backend/infrastructure
terraform plan    # Review changes
terraform apply   # Apply changes
```

Terraform will automatically:
- Rebuild Lambda packages with new code
- Update Lambda functions
- Update API Gateway if needed
- Update frontend infrastructure if changed

---

## Destroying Infrastructure

To remove all resources (⚠️ **Warning**: This deletes all data!):

```bash
cd backend/infrastructure
terraform destroy
```

This will delete:
- All Lambda functions
- API Gateway
- DynamoDB table (and all chat data!)
- Cognito User Pool (and all users!)
- S3 bucket and CloudFront distribution
- All IAM roles and policies

---

## Local Development

### Frontend Development (Without Backend)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` - UI will render but auth/API won't work.

### With Docker

```bash
docker-compose up frontend
```

See [LOCAL_DEV.md](./LOCAL_DEV.md) for detailed local development guide.

---

## Support

For issues:
1. Check CloudWatch logs
2. Review GitHub Actions logs
3. Check Terraform state
4. Review this checklist

**Congratulations! Your EmpaMind app is deployed! 🚀**

