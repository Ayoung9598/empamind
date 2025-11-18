import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './ResetPasswordForm.css'

const ResetPasswordForm = ({ email, onBack }) => {
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { confirmForgotPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    const result = await confirmForgotPassword(email, code, newPassword)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        // Redirect to login after 2 seconds
        window.location.reload()
      }, 2000)
    } else {
      setError(result.error || 'Failed to reset password. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="reset-success">
        <div className="success-icon">✓</div>
        <h3>Password Reset Successful!</h3>
        <p>Your password has been reset. Redirecting to sign in...</p>
      </div>
    )
  }

  return (
    <div className="reset-password-form">
      <h3>Enter Reset Code</h3>
      <p className="reset-password-text">
        We've sent a reset code to <strong>{email}</strong>
      </p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="reset-code">Reset Code</label>
          <input
            type="text"
            id="reset-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="Enter 6-digit code"
            disabled={loading}
            maxLength={6}
            pattern="[0-9]{6}"
          />
        </div>

        <div className="form-group">
          <label htmlFor="new-password">New Password</label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="At least 8 characters"
            disabled={loading}
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-new-password">Confirm New Password</label>
          <input
            type="password"
            id="confirm-new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter your new password"
            disabled={loading}
            minLength={8}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading || code.length !== 6 || !newPassword}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <button type="button" className="link-button back-button" onClick={onBack}>
          ← Back
        </button>
      </form>
    </div>
  )
}

export default ResetPasswordForm

