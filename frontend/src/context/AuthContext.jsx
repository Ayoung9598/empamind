import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  confirmSignUp, 
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  updatePassword
} from 'aws-amplify/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    // Skip auth check if Cognito is not configured (for local UI testing)
    // Show auth pages but don't auto-authenticate
    if (!import.meta.env.VITE_COGNITO_USER_POOL_ID) {
      setUser(null)
      setIsAuthenticated(false) // Show sign up/login pages for UI testing
      setLoading(false)
      return
    }
    
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsAuthenticated(true)
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    // Check if Cognito is configured
    if (!import.meta.env.VITE_COGNITO_USER_POOL_ID) {
      return { success: false, error: 'Authentication not configured. Please set up Cognito User Pool.' }
    }
    
    try {
      const output = await signIn({ username: email, password })
      if (output.isSignedIn) {
        await checkAuthState()
        return { success: true }
      }
      return { success: false, error: 'Sign in incomplete' }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to sign in' }
    }
  }

  const register = async (email, password) => {
    // Check if Cognito is configured
    if (!import.meta.env.VITE_COGNITO_USER_POOL_ID) {
      return { success: false, error: 'Authentication not configured. Please set up Cognito User Pool.' }
    }
    
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      })
      return { success: true, requiresConfirmation: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const confirmRegistration = async (email, confirmationCode) => {
    try {
      await confirmSignUp({ username: email, confirmationCode })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const resendConfirmationCode = async (email) => {
    try {
      await resendSignUpCode({ username: email })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      setIsAuthenticated(false)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const forgotPassword = async (email) => {
    try {
      await resetPassword({ username: email })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to send reset code' }
    }
  }

  const confirmForgotPassword = async (email, confirmationCode, newPassword) => {
    try {
      await confirmResetPassword({ 
        username: email, 
        confirmationCode, 
        newPassword 
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to reset password' }
    }
  }

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await updatePassword({ oldPassword, newPassword })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to change password' }
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    confirmRegistration,
    resendConfirmationCode,
    logout,
    forgotPassword,
    confirmForgotPassword,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

