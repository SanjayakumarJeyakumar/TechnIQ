export default function MessageBubble({ content, createdAt, isOwn }) {
  const time = new Date(createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{
      display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: 'var(--sp-2)',
    }}>
      <div style={{ maxWidth: '75%' }}>
        <div style={{
          padding: 'var(--sp-2) var(--sp-3)',
          borderRadius: isOwn
            ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)'
            : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
          background: isOwn ? 'var(--violet-600)' : 'var(--surface-2)',
          color: isOwn ? '#fff' : 'var(--ink-900)',
          fontSize: 'var(--text-base)', wordBreak: 'break-word',
        }}>
          {content}
        </div>
        <div style={{
          fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginTop: 2,
          textAlign: isOwn ? 'right' : 'left',
        }}>
          {time}
        </div>
      </div>
    </div>
  )
}
