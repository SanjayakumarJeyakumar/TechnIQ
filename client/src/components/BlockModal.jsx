import { useState } from 'react'
import Modal from './Modal'

export default function BlockModal({ isOpen, onClose, studentName, onConfirmBlock }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleBlock = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirmBlock()
      onClose()
    } catch (err) {
      console.error('Block failed:', err)
      setError(err.message || 'Failed to block user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Block ${studentName || 'Student'}?`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <p style={{ color: 'var(--ink-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
          Are you sure you want to block <strong>{studentName}</strong>? Once blocked:
        </p>

        <ul style={{
          margin: 0,
          paddingLeft: 'var(--sp-4)',
          color: 'var(--ink-700)',
          fontSize: 'var(--text-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-1)',
        }}>
          <li>They will disappear from your search and discovery results.</li>
          <li>They cannot send you learning requests or messages.</li>
          <li>You can unblock them at any time from their profile.</li>
        </ul>

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
            type="button"
            onClick={handleBlock}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--sp-3) var(--sp-5)',
              background: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              minHeight: 44,
            }}
          >
            {loading ? 'Blocking…' : 'Block Student'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
