# Setting Up GitHub Repository

Follow these steps to create your GitHub repo and add secrets securely.

## Step 1: Initialize Git Repository

```powershell
# Initialize git (if not already done)
git init

# Add all files (sensitive files are already gitignored)
git add .

# Create initial commit
git commit -m "Initial commit: EmpaMind project"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Repository name: `empamind` (or your preferred name)
4. Description: "EmpaMind - AI Mental Wellness Companion"
5. Choose **Private** (recommended for production) or **Public**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **Create repository**

## Step 3: Connect Local Repo to GitHub

After creating the repo, GitHub will show you commands. Use these:

```powershell
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/empamind.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Add GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets:

Add these one by one:

1. **AWS_ACCESS_KEY_ID**
   - Your AWS access key ID

2. **AWS_SECRET_ACCESS_KEY**
   - Your AWS secret access key

3. **VITE_COGNITO_USER_POOL_ID**
   ```powershell
   cd backend/infrastructure
   terraform output user_pool_id
   ```

4. **VITE_COGNITO_USER_POOL_CLIENT_ID**
   ```powershell
   terraform output user_pool_client_id
   ```

5. **VITE_API_ENDPOINT**
   ```powershell
   terraform output api_endpoint
   ```

### Frontend Deployment Secrets (if using S3 + CloudFront):

6. **S3_BUCKET_NAME**
   ```powershell
   terraform output frontend_bucket_name
   ```

7. **CLOUDFRONT_DIST_ID** (optional - for cache invalidation)
   ```powershell
   terraform output frontend_cloudfront_distribution_id
   ```

## Step 5: Verify Secrets Are Protected

✅ Check that these files are **NOT** in your repo:
- `backend/infrastructure/terraform.tfvars`
- `backend/infrastructure/secrets.local.json`
- `frontend/.env`
- `backend/infrastructure/terraform.tfstate*`

If any appear, they're already gitignored and won't be committed.

## Step 6: Create Frontend .env for Local Development

```powershell
cd frontend
copy env.example .env
```

Then edit `.env` with your Terraform outputs (this file is gitignored).

## Next Steps

After setting up GitHub:
1. ✅ Secrets are stored in GitHub (secure)
2. ✅ Local `.env` files are gitignored (safe)
3. ✅ CI/CD workflows can use GitHub secrets
4. ✅ You can share the repo without exposing secrets

## Troubleshooting

**If you accidentally committed secrets:**
1. Remove them from git history (use `git filter-branch` or BFG Repo-Cleaner)
2. Rotate/regenerate the exposed secrets
3. Update `.gitignore` to prevent future commits

**To verify what will be committed:**
```powershell
git status
git diff --cached  # Shows what's staged
```

