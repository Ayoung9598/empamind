# How to Save Terraform Outputs Securely

Since you don't have GitHub set up yet, here's how to store your outputs locally:

## Option 1: Save as JSON (Recommended)

Run this command in the `backend/infrastructure` directory:

```bash
terraform output -json > secrets.local.json
```

This creates a JSON file with all outputs that is **already gitignored**.

## Option 2: Save Individual Values

Run these commands to get individual values:

```bash
terraform output user_pool_id
terraform output user_pool_client_id
terraform output api_endpoint
terraform output chat_table_name
terraform output frontend_bucket_name
terraform output frontend_cloudfront_url
```

Then manually copy them to:
- **Frontend**: `frontend/.env` (for local development)
- **GitHub Secrets**: When you create your repo, add them as secrets

## Option 3: Create Frontend .env File

Copy the example and fill it in:

```bash
cd frontend
cp env.example .env
```

Then edit `.env` with your values from `terraform output`.

## What to Do Next

1. **Save outputs now** using Option 1 (JSON file)
2. **Create your GitHub repo** when ready
3. **Add secrets to GitHub**: Settings → Secrets and variables → Actions
4. **Delete local secrets** after adding to GitHub (optional, but recommended)

## Important Notes

- ✅ `secrets.local.json` is already in `.gitignore` - safe to create
- ✅ `frontend/.env` is already in `.gitignore` - safe to create
- ❌ Never commit these files to Git
- ❌ Never share these values publicly

