export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-8) 0',
      color: 'var(--ink-500)',
    }}>
      <div
        aria-hidden="true"
        style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2.5px solid var(--ink-100)',
          borderTopColor: 'var(--violet-400)',
          animation: 'techniq-spin 0.7s linear infinite',
        }}
      />
      <span style={{ fontSize: 'var(--text-sm)' }}>{label}</span>
      <style>{`@keyframes techniq-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
