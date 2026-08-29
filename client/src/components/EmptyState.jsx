export default function EmptyState({ title, description, action }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--sp-8) var(--sp-5)',
      border: '1px dashed var(--surface-3)',
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-1)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <h3 style={{ marginBottom: 'var(--sp-2)', color: '#FFFFFF', fontSize: 'var(--text-lg)' }}>{title}</h3>
      {description && (
        <p style={{ maxWidth: 420, margin: '0 auto var(--sp-4)', color: 'var(--ink-500)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
