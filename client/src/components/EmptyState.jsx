export default function EmptyState({ title, description, action }) {
  return (
    <div style={{
      textAlign: 'center', padding: 'var(--sp-8) var(--sp-5)',
      border: '1px dashed var(--ink-100)', borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-1)',
    }}>
      <h3 style={{ marginBottom: 'var(--sp-2)' }}>{title}</h3>
      {description && (
        <p style={{ maxWidth: 360, margin: '0 auto var(--sp-4)', color: 'var(--ink-500)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
