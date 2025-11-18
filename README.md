# EmpaMind

AI-powered mental wellness companion for Nigerians and Africans.

## Quick Start (Frontend Only - UI Testing)

To test the frontend UI locally without deploying to AWS:

### Option 1: Docker (Recommended)
```bash
docker-compose up frontend
```
Then open http://localhost:3000

### Option 2: Without Docker
```bash
cd frontend
npm install
npm run dev
```
Then open http://localhost:3000

**Note:** Authentication and API calls won't work without backend deployment, but you can see and test all UI components.

See [LOCAL_DEV.md](./LOCAL_DEV.md) for detailed local development guide.

---

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
- Modern, responsive UI

### Backend
- AWS Lambda (Python 3.11 with boto3)
- API Gateway (REST API)
- Amazon Bedrock (Amazon Nova Micro)
- Amazon Comprehend (sentiment analysis)
- Amazon DynamoDB (chat storage)
- Amazon Cognito (authentication)
- Terraform (Infrastructure as Code)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS account with appropriate permissions
- AWS CLI configured
- AWS SAM CLI (for backend deployment)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your AWS values (after backend deployment):
```
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_USER_POOL_CLIENT_ID=your-client-id
VITE_API_ENDPOINT=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
```

5. Start development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to infrastructure directory:
```bash
cd backend/infrastructure
```

2. Configure Terraform (optional):
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars if needed
```

3. Initialize and deploy:
```bash
terraform init
terraform plan
terraform apply
```

4. Note the outputs from deployment:
   - user_pool_id
   - user_pool_client_id
   - api_endpoint

5. Update frontend `.env` file with these values.

## Project Structure

```
empamind/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service layer
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── infrastructure/
│   │   ├── main.tf          # Terraform root configuration
│   │   ├── modules/         # Terraform modules
│   │   │   ├── cognito/     # Cognito User Pool
│   │   │   ├── dynamodb/   # DynamoDB table
│   │   │   ├── lambda/     # Lambda functions
│   │   │   ├── api_gateway/ # API Gateway
│   │   │   ├── frontend/   # S3 + CloudFront hosting
│   │   │   └── state/     # Terraform state storage
│   │   └── terraform.tfvars.example
│   └── prompts/
│       └── english-system-prompt.js
├── .github/workflows/
│   ├── deploy.yml          # Automated deployment
│   └── pr-checks.yml       # PR validation
└── README.md
```

## AWS Free Tier

This project is designed to stay within AWS Free Tier limits:
- Lambda: 1M requests/month ✅
- API Gateway: 1M requests/month ✅
- DynamoDB: 25GB storage ✅
- Cognito: 50K MAU (Monthly Active Users) ✅
- S3: 5GB storage, 20K GET requests ✅
- CloudFront: 50GB transfer, 2M requests ✅
- Comprehend: 50K characters/month ✅
- Bedrock: Pay-per-use (~$0.25 per 1K tokens, minimal for MVP)

**Expected Monthly Cost: $0-5** for MVP

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Testing
```bash
# Test Lambda functions locally (requires AWS credentials)
cd backend/lambda/chat-handler
python -m pytest  # If tests are added
```

## Deployment

EmpaMind uses **GitHub Actions** for fully automated CI/CD with full AWS stack deployment!

**Quick Start:**
1. Deploy backend infrastructure with Terraform
2. Add GitHub Secrets (AWS credentials, Terraform outputs)
3. Push to `main` branch
4. Everything deploys automatically! 🚀

See **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** for complete step-by-step deployment instructions.

## Environment Variables

### Frontend (.env)
- `VITE_COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: Cognito Client ID
- `VITE_API_ENDPOINT`: API Gateway endpoint URL
- `VITE_AWS_REGION`: AWS region

### Backend (Terraform)
- All environment variables are automatically set by Terraform
- Lambda functions receive: `AWS_REGION`, `CHAT_TABLE_NAME`, `BEDROCK_MODEL_ID`

## Future Enhancements

- [ ] Nigerian Pidgin language support
- [ ] Voice mode (Polly + Transcribe)
- [ ] Advanced emotion detection
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-session management

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

