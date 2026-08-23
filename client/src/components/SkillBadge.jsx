export default function SkillBadge({ children, emphasized = false }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--text-xs)',
      fontWeight: emphasized ? 600 : 400,
      background: emphasized ? 'var(--violet-50)' : 'var(--surface-2)',
      color: emphasized ? 'var(--violet-800)' : 'var(--ink-700)',
      border: emphasized ? '1px solid var(--violet-100)' : '1px solid transparent',
    }}>
      {children}
    </span>
  )
}
