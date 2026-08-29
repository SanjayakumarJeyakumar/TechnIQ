import { useState } from 'react'
import Modal from './Modal'

const REASONS = [
  { value: 'spam', label: 'Spam or commercial promotion' },
  { value: 'harassment', label: 'Harassment or offensive behavior' },
  { value: 'inappropriate_behavior', label: 'Inappropriate conduct during a session' },
  { value: 'inappropriate_profile', label: 'Inappropriate profile or avatar' },
  { value: 'other', label: 'Other safety concern' },
]

export default function ReportModal({ isOpen, onClose, studentName, onConfirmReport }) {
  const [reason, setReason] = useState('spam')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onConfirmReport({ reason, description })
      onClose()
    } catch (err) {
      console.error('Report submission failed:', err)
      setError(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report ${studentName || 'Student'}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <p style={{ color: 'var(--ink-700)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Help us keep TechnIQ safe. Select the reason for your report:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {REASONS.map((r) => (
            <label
              key={r.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-3)',
                background: reason === r.value ? 'rgba(0, 193, 106, 0.08)' : 'var(--surface-2)',
                border: reason === r.value ? '1px solid var(--brand-primary)' : '1px solid var(--surface-3)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease-out)',
              }}
            >
              <input
                type="radio"
                name="reportReason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                style={{ accentColor: 'var(--brand-primary)' }}
              />
              <span style={{ fontSize: 'var(--text-sm)', color: '#FFFFFF', fontWeight: 500 }}>
                {r.label}
              </span>
            </label>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginBottom: 'var(--sp-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Additional Details (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened or provide context…"
            rows={3}
            className="input-dark"
            style={{ resize: 'vertical' }}
          />
        </div>

        {error && (
          <div style={{
            padding: 'var(--sp-3)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FFFFFF',
            fontSize: 'var(--text-xs)',
          }}>
            ✕ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
            style={{ minWidth: 90 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-brand-primary"
            style={{ minWidth: 130 }}
          >
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
