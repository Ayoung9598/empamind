import { Amplify } from 'aws-amplify'
import { ChatProvider } from './context/ChatContext'
import { AuthProvider } from './context/AuthContext'
import ChatInterface from './components/ChatInterface'
import AuthGuard from './components/AuthGuard'
import './App.css'

// Configure Amplify - these will be replaced with actual values from environment
// For local UI testing, empty values are allowed (auth/API won't work but UI will render)
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    REST: {
      empamind: {
        endpoint: import.meta.env.VITE_API_ENDPOINT || '',
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      },
    },
  },
}

// Only configure Amplify if we have at least the User Pool ID
// This allows UI testing without backend
if (import.meta.env.VITE_COGNITO_USER_POOL_ID) {
  Amplify.configure(amplifyConfig)
}

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>EmpaMind</h1>
        <p className="subtitle">Your AI Mental Wellness Companion</p>
      </header>
      <main className="app-main">
        <AuthProvider>
          <ChatProvider>
            <AuthGuard>
              <ChatInterface />
            </AuthGuard>
          </ChatProvider>
        </AuthProvider>
      </main>
    </div>
  )
}

export default App

