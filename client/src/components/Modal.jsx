import { useEffect } from 'react'

export default function Modal({ title, children, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(22, 21, 28, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-4)', zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-6)', width: '100%', maxWidth: 440,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--ink-500)', lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
