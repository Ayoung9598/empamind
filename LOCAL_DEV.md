# Local Development Guide

## Quick Start (Docker)

1. **Start the frontend container:**
   ```bash
   docker-compose up frontend
   ```

2. **Open your browser:**
   - Navigate to http://localhost:3000
   - You'll see the authentication UI

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## Quick Start (Without Docker)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to http://localhost:3000

## Testing UI Without Backend

The frontend is designed to work even without AWS resources deployed:

### What Works:
- ✅ All UI components render
- ✅ Authentication forms (login, signup, forgot password)
- ✅ Chat interface layout
- ✅ Sidebar with chat list
- ✅ Message bubbles
- ✅ Loading states
- ✅ Error messages

### What Won't Work:
- ❌ Actual authentication (no Cognito connection)
- ❌ API calls (no backend endpoints)
- ❌ Real chat functionality

### Expected Behavior:
- **Login/Signup**: Forms will show, but submitting will fail (expected)
- **Chat Interface**: Will show empty state or error messages (expected)
- **UI Components**: All will render and be testable

## Environment Variables

For local UI testing, you don't need any environment variables. The app will work with empty values.

When you're ready to connect to AWS:
1. Deploy backend with Terraform
2. Get outputs from Terraform
3. Create `frontend/.env.local` with:
   ```
   VITE_COGNITO_USER_POOL_ID=your-pool-id
   VITE_COGNITO_USER_POOL_CLIENT_ID=your-client-id
   VITE_API_ENDPOINT=https://your-api-id.execute-api.region.amazonaws.com/prod
   VITE_AWS_REGION=us-east-1
   ```

## Docker Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop
docker-compose down

# Rebuild after changes
docker-compose up --build
```

## Hot Reload

Docker setup includes volume mounting, so changes to frontend code will hot-reload automatically.

