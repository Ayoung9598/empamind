import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './ChangePasswordForm.css'

const ChangePasswordForm = ({ onCancel }) => {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { changePassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)
    const result = await changePassword(oldPassword, newPassword)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setSuccess(false)
        if (onCancel) onCancel()
      }, 2000)
    } else {
      setError(result.error || 'Failed to change password. Please check your current password.')
    }
  }

  return (
    <div className="change-password-form">
      <h3>Change Password</h3>
      
      {success && (
        <div className="success-message">
          Password changed successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="old-password">Current Password</label>
          <input
            type="password"
            id="old-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            placeholder="Enter current password"
            disabled={loading || success}
          />
        </div>

        <div className="form-group">
          <label htmlFor="change-new-password">New Password</label>
          <input
            type="password"
            id="change-new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="At least 8 characters"
            disabled={loading || success}
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="change-confirm-password">Confirm New Password</label>
          <input
            type="password"
            id="change-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter new password"
            disabled={loading || success}
            minLength={8}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || success}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ChangePasswordForm

