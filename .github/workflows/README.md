# GitHub Actions Workflows

This directory contains automated CI/CD workflows for EmpaMind.

## Workflows

### 1. `deploy.yml` - Automated Deployment

**Triggers:**
- Push to `main` or `master` branch
- Manual trigger via `workflow_dispatch`

**What it does:**
1. Deploys backend infrastructure using Terraform
2. Builds and deploys frontend
3. Automatically handles both backend and frontend deployment

**Required Secrets:**
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `VITE_COGNITO_USER_POOL_ID` - Cognito User Pool ID (set after first backend deployment)
- `VITE_COGNITO_USER_POOL_CLIENT_ID` - Cognito Client ID (set after first backend deployment)
- `VITE_API_ENDPOINT` - API Gateway endpoint (set after first backend deployment)

**Optional Secrets (for frontend deployment):**
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` - For Vercel deployment
- `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` - For Netlify deployment
- `S3_BUCKET_NAME`, `CLOUDFRONT_DIST_ID` - For S3/CloudFront deployment

### 2. `pr-checks.yml` - Pull Request Validation

**Triggers:**
- Pull requests to `main` or `master`
- Pushes to non-main branches

**What it does:**
1. Validates Terraform syntax and configuration
2. Checks frontend code (linting and build)
3. Ensures code quality before merging

### 3. `deploy-manual.yml` - Manual Deployment

**Triggers:**
- Manual trigger only (`workflow_dispatch`)

**What it does:**
- Allows manual deployment to different environments (prod, staging, dev)
- Useful for testing or emergency deployments

## Setup Instructions

### First Time Setup

1. **Deploy Backend Manually (First Time Only)**:
   ```bash
   cd backend/infrastructure
   terraform init
   terraform apply
   ```

2. **Get Terraform Outputs**:
   ```bash
   terraform output
   ```

3. **Add GitHub Secrets**:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `VITE_COGNITO_USER_POOL_ID` (from terraform output)
     - `VITE_COGNITO_USER_POOL_CLIENT_ID` (from terraform output)
     - `VITE_API_ENDPOINT` (from terraform output)
     - Frontend deployment secrets (Vercel/Netlify/S3)

4. **Push to Main**:
   - After secrets are configured, push to `main` branch
   - Workflow will automatically deploy both backend and frontend

### Subsequent Deployments

Simply push to `main` branch - everything is automated!

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The workflow will:
1. ✅ Validate Terraform
2. ✅ Deploy backend changes
3. ✅ Build frontend
4. ✅ Deploy frontend
5. ✅ Update infrastructure

## Workflow Status

Check workflow status at:
- GitHub Actions tab in your repository
- Or: `https://github.com/YOUR_USERNAME/empamind/actions`

## Troubleshooting

### Backend Deployment Fails

- Check AWS credentials in secrets
- Verify Bedrock model access is granted
- Check Terraform state is accessible

### Frontend Deployment Fails

- Verify environment variables are set in secrets
- Check deployment service credentials (Vercel/Netlify/S3)
- Ensure build completes successfully

### PR Checks Fail

- Fix Terraform formatting: `terraform fmt`
- Fix Terraform validation errors
- Fix frontend linting errors

## Manual Deployment

If you need to deploy manually:

1. Go to Actions tab
2. Select "Deploy EmpaMind" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

Or use the manual deployment workflow for environment-specific deployments.
