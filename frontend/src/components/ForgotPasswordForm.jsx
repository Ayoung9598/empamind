import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ResetPasswordForm from './ResetPasswordForm'
import './ForgotPasswordForm.css'

const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await forgotPassword(email)
    setLoading(false)

    if (result.success) {
      setCodeSent(true)
    } else {
      setError(result.error || 'Failed to send reset code. Please try again.')
    }
  }

  if (codeSent) {
    return <ResetPasswordForm email={email} onBack={() => setCodeSent(false)} />
  }

  return (
    <div className="forgot-password-form">
      <h3>Reset Password</h3>
      <p className="forgot-password-text">
        Enter your email address and we'll send you a code to reset your password.
      </p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="reset-email">Email</label>
          <input
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>

        <button type="button" className="link-button back-button" onClick={onBack}>
          ← Back to sign in
        </button>
      </form>
    </div>
  )
}

export default ForgotPasswordForm

