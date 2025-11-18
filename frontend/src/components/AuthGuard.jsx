import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import './AuthGuard.css'

const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const [showSignUp, setShowSignUp] = useState(true) // Start with sign up page
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          {showForgotPassword ? (
            <>
              <h2>Reset Password</h2>
              <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
            </>
          ) : showSignUp ? (
            <>
              <h2>Create Account</h2>
              <p className="auth-subtitle">Sign up to start your wellness journey</p>
              <SignUpForm onSwitchToLogin={() => setShowSignUp(false)} />
            </>
          ) : (
            <>
              <h2>Welcome to EmpaMind</h2>
              <p className="auth-subtitle">Sign in to continue your conversation</p>
              <LoginForm 
                onSwitchToSignUp={() => setShowSignUp(true)} 
                onForgotPassword={() => setShowForgotPassword(true)}
              />
            </>
          )}
        </div>
      </div>
    )
  }

  return children
}

export default AuthGuard

