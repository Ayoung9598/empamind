import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './ConfirmationForm.css'

const ConfirmationForm = ({ email, onBack }) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { confirmRegistration, resendConfirmationCode } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await confirmRegistration(email, code)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Invalid confirmation code. Please try again.')
    }
  }

  const handleResend = async () => {
    setError('')
    setResending(true)
    const result = await resendConfirmationCode(email)
    setResending(false)
    
    if (result.success) {
      setError('Confirmation code resent! Check your email.')
      setTimeout(() => setError(''), 3000)
    } else {
      setError(result.error || 'Failed to resend code.')
    }
  }

  return (
    <div className="confirmation-form">
      <h3>Confirm Your Email</h3>
      <p className="confirmation-text">
        We've sent a confirmation code to <strong>{email}</strong>
      </p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className={error.includes('resent') ? 'success-message' : 'error-message'}>
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="confirmation-code">Confirmation Code</label>
          <input
            type="text"
            id="confirmation-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="Enter 6-digit code"
            disabled={loading}
            maxLength={6}
            pattern="[0-9]{6}"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading || code.length !== 6}>
          {loading ? 'Confirming...' : 'Confirm'}
        </button>

        <p className="resend-text">
          Didn't receive the code?{' '}
          <button
            type="button"
            className="link-button"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Resending...' : 'Resend'}
          </button>
        </p>

        <button type="button" className="link-button back-button" onClick={onBack}>
          ← Back to sign up
        </button>
      </form>
    </div>
  )
}

export default ConfirmationForm

