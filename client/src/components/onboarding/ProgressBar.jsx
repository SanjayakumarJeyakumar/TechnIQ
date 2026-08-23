export default function ProgressBar({ current, total }) {
  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginBottom: 'var(--sp-2)',
      }}>
        <span>Step {current} of {total}</span>
      </div>
      <div style={{
        height: 4, background: 'var(--ink-100)', borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${(current / total) * 100}%`,
          background: 'var(--violet-500, var(--violet-600))',
          transition: 'width var(--dur-base) var(--ease-out)',
        }} />
      </div>
    </div>
  )
}
