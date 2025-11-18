# Save Terraform Outputs to JSON file
# This file is gitignored and safe to use locally

Write-Host "Saving Terraform outputs to secrets.local.json..." -ForegroundColor Green

terraform output -json > secrets.local.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Outputs saved successfully to secrets.local.json" -ForegroundColor Green
    Write-Host "📝 This file is gitignored and will NOT be committed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review the file: secrets.local.json" -ForegroundColor White
    Write-Host "2. When ready, add these values to GitHub Secrets" -ForegroundColor White
    Write-Host "3. Create frontend/.env file for local development" -ForegroundColor White
} else {
    Write-Host "❌ Error saving outputs. Make sure you're in the infrastructure directory." -ForegroundColor Red
}

