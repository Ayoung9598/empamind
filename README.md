# EmpaMind - AI Mental Wellness Companion

EmpaMind is an AI-powered mental wellness companion built for Nigerians and Africans, designed to help users express their emotions, find comfort, and receive empathetic support through chat conversations.

## Features

- 🤖 **AI-Powered Conversations**: Empathetic responses using Amazon Bedrock (Amazon Nova Micro)
- 💭 **Sentiment Analysis**: Real-time emotion detection using Amazon Comprehend
- 🔐 **User Authentication**: Secure authentication with Amazon Cognito
- 💬 **Chat History**: Persistent conversation history stored in DynamoDB
- 📱 **Responsive Design**: Modern, mobile-friendly UI built with React
- 🌍 **English Support**: Currently supports English (Pidgin support coming soon)

## Architecture

### Frontend
- React with Vite
- AWS Amplify for Cognito integration
- Modern, responsive UI ("Midnight Aurora" theme)

### Backend
- AWS Lambda (Python 3.11 with boto3)
- API Gateway (REST API)
- Amazon Bedrock (Amazon Nova Micro)
- Amazon Comprehend (sentiment analysis)
- Amazon DynamoDB (chat storage)
- Amazon Cognito (authentication)
- Terraform (Infrastructure as Code)

---

## Quick Start

### 1. Frontend Only (UI Testing)

To test the frontend UI locally without deploying to AWS:

**Option 1: Docker (Recommended)**
```bash
docker-compose up frontend
```
Then open http://localhost:3000

**Option 2: Without Docker**
```bash
cd frontend
npm install
npm run dev
```
Then open http://localhost:3000

**Note:** Authentication and API calls won't work without backend deployment, but you can test all UI components.

### 2. Full Stack Deployment (AWS)

#### Prerequisites
- AWS Account with admin access
- AWS CLI installed and configured (`aws configure`)
- Terraform >= 1.0 installed
- Node.js 18+ and npm

#### Step 1: Deploy Backend
```bash
cd backend/infrastructure
terraform init
terraform plan
terraform apply
```
Copy the outputs (`user_pool_id`, `user_pool_client_id`, `api_endpoint`).

#### Step 2: Configure Frontend
Create `frontend/.env.local` with the values from Terraform output:
```env
VITE_COGNITO_USER_POOL_ID=<your_user_pool_id>
VITE_COGNITO_USER_POOL_CLIENT_ID=<your_client_id>
VITE_API_ENDPOINT=<your_api_endpoint>
VITE_AWS_REGION=us-east-1
```

#### Step 3: Run Full Application
```bash
cd frontend
npm run dev
```

---

## CI/CD Pipeline

EmpaMind uses **GitHub Actions** for fully automated CI/CD:

1. **Backend Deployment**: Terraform applies infrastructure changes automatically.
2. **Frontend Deployment**: Builds React app and syncs to S3 + CloudFront.

### Setup GitHub Secrets
To enable the pipeline, add these secrets to your GitHub repo:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME` (from `terraform output frontend_bucket_name`)
- `CLOUDFRONT_DIST_ID` (optional, from `terraform output frontend_cloudfront_distribution_id`)

---

## Project Structure

```
empamind/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (ChatInterface, Sidebar, etc.)
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service layer
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── infrastructure/
│   │   ├── main.tf          # Terraform root configuration
│   │   ├── modules/         # Terraform modules (Lambda, API Gateway, DynamoDB, etc.)
│   │   └── terraform.tfvars
│   └── prompts/
│       └── english-system-prompt.js
├── .github/workflows/
│   └── deploy.yml          # CI/CD workflow
└── README.md
```

## AWS Free Tier Compliance

This project is designed to stay within AWS Free Tier limits:
- Lambda: 1M requests/month ✅
- API Gateway: 1M requests/month ✅
- DynamoDB: 25GB storage ✅
- Cognito: 50K MAU (Monthly Active Users) ✅
- S3: 5GB storage, 20K GET requests ✅
- CloudFront: 50GB transfer, 2M requests ✅
- Comprehend: 50K characters/month ✅
- Bedrock: Pay-per-use (Minimal cost for MVP, ~$0.25 per 1K tokens)

**Expected Monthly Cost: $0-5** for MVP usage.

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
