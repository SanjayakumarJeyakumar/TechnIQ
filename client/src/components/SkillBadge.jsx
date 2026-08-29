export default function SkillBadge({ children, emphasized = false }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--text-xs)',
      fontWeight: emphasized ? 600 : 500,
      background: emphasized ? 'var(--brand-subtle)' : 'var(--surface-3)',
      color: emphasized ? 'var(--brand-primary)' : 'var(--ink-700)',
      border: emphasized ? '1px solid var(--brand-border)' : '1px solid transparent',
      transition: 'all var(--dur-fast) var(--ease-out)',
    }}>
      {children}
    </span>
  )
}
