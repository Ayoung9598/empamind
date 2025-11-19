import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './ConfirmationForm.css'

const ConfirmationForm = ({ email, onBack, onConfirmed }) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { confirmRegistration, resendConfirmationCode } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await confirmRegistration(email, code)
    setLoading(false)

    // Debug logging (remove in production)
    console.log('Confirmation result:', result)

    if (result.success) {
      setSuccess(true)
      setError('')
      // Call onConfirmed callback if provided (to switch to login form)
      if (onConfirmed) {
        console.log('Calling onConfirmed callback')
        setTimeout(() => {
          onConfirmed()
        }, 2000)
      } else {
        console.warn('onConfirmed callback not provided')
      }
    } else {
      // Handle "already confirmed" error message more gracefully
      const errorMsg = result.error || ''
      const errorString = errorMsg.toUpperCase()
      const isAlreadyConfirmed = errorString.includes('CONFIRMED') || 
                                  errorString.includes('ALREADY CONFIRMED') ||
                                  errorString.includes('CURRENT STATUS IS CONFIRMED') ||
                                  errorString.includes('CANNOT BE CONFIRMED')
      
      console.log('Error detected:', errorMsg, 'Is already confirmed:', isAlreadyConfirmed)
      
      if (isAlreadyConfirmed) {
        setSuccess(true)
        setError('')
        // Call onConfirmed callback even for already confirmed users
        if (onConfirmed) {
          console.log('Calling onConfirmed callback for already confirmed user')
          setTimeout(() => {
            onConfirmed()
          }, 2000)
        } else {
          console.warn('onConfirmed callback not provided for already confirmed user')
        }
      } else {
        setError(result.error || 'Invalid confirmation code. Please try again.')
      }
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

  if (success) {
    return (
      <div className="confirmation-form">
        <h3>Email Confirmed! ✅</h3>
        <p className="confirmation-text">
          Your email <strong>{email}</strong> has been successfully confirmed.
        </p>
        <p className="confirmation-text">
          You can now sign in to start using EmpaMind.
        </p>
        {onConfirmed && (
          <p className="confirmation-text" style={{ color: '#666', fontSize: '0.9em' }}>
            Redirecting to sign in...
          </p>
        )}
      </div>
    )
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

