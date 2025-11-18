# Frontend Hosting Module

This module creates an S3 bucket and CloudFront distribution for hosting the EmpaMind frontend application.

## Resources Created

1. **S3 Bucket** - Stores frontend static files
   - Versioning enabled (for rollback capability)
   - Server-side encryption (AES256)
   - Public access blocked (accessed only via CloudFront)
   - Bucket policy allowing CloudFront OAC access

2. **CloudFront Origin Access Control (OAC)** - Modern secure access to private S3 bucket (replaces deprecated OAI)

3. **CloudFront Distribution** - Global CDN for frontend
   - HTTPS enabled (default CloudFront certificate)
   - SPA routing support (404/403 → index.html)
   - Compression enabled
   - IPv6 enabled
   - Price class: North America and Europe only (to reduce costs)

## Usage

```hcl
module "frontend" {
  source = "./modules/frontend"

  bucket_name = "empamind-frontend-prod"
  environment = "prod"
}
```

## Variables

- `bucket_name` - Globally unique S3 bucket name
- `environment` - Environment name for tagging

## Outputs

- `bucket_name` - S3 bucket name (for GitHub Actions secret)
- `cloudfront_distribution_id` - CloudFront distribution ID (for cache invalidation)
- `cloudfront_domain_name` - CloudFront domain name
- `cloudfront_url` - Full HTTPS URL for the frontend

## Deployment

After Terraform creates these resources:

1. **Set GitHub Secrets**:
   - `S3_BUCKET_NAME` = `bucket_name` output
   - `CLOUDFRONT_DIST_ID` = `cloudfront_distribution_id` output (optional, for cache invalidation)

2. **Deploy frontend**:
   - The GitHub Actions workflow will automatically deploy to S3
   - CloudFront will serve the content globally

3. **Custom Domain (Optional)**:
   - Add your domain in CloudFront console
   - Update DNS to point to CloudFront distribution
   - Configure SSL certificate in AWS Certificate Manager

## Cost

- **S3**: Free tier (5GB storage, 20K GET requests/month)
- **CloudFront**: Free tier (50GB transfer, 2M requests/month)
- **After free tier**: ~$0-2/month for small apps

