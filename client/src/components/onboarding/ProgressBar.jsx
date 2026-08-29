export default function ProgressBar({ current, total }) {
  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginBottom: 'var(--sp-2)',
        fontWeight: 600,
      }}>
        <span>Step {current} of {total}</span>
        <span>{Math.round((current / total) * 100)}%</span>
      </div>
      <div style={{
        height: 6, background: 'var(--surface-3)', borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${(current / total) * 100}%`,
          background: 'var(--brand-primary)',
          boxShadow: '0 0 8px rgba(0, 193, 106, 0.6)',
          transition: 'width var(--dur-base) var(--ease-out)',
        }} />
      </div>
    </div>
  )
}
