export default function MessageBubble(props) {
  // Support both object prop `message` and flattened props (content, createdAt, isOwn, isMine)
  const msg = props.message || {}
  const text = props.content ?? msg.content ?? ''
  const rawDate = props.createdAt ?? props.created_at ?? msg.created_at ?? msg.createdAt
  const own = Boolean(props.isOwn ?? props.isMine ?? msg.isOwn ?? msg.isMine)

  let timeString = 'Recently'
  if (rawDate) {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      timeString = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: own ? 'flex-end' : 'flex-start',
      marginBottom: 'var(--sp-2)',
      width: '100%',
    }}>
      <div style={{ maxWidth: '80%', minWidth: '60px' }}>
        <div style={{
          padding: 'var(--sp-2) var(--sp-4)',
          borderRadius: own
            ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)'
            : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
          background: own ? 'var(--brand-primary)' : 'var(--surface-2)',
          color: own ? '#0F1115' : '#FFFFFF',
          fontWeight: own ? 600 : 400,
          border: own ? 'none' : '1px solid var(--surface-3)',
          fontSize: 'var(--text-base)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          boxShadow: own ? '0 2px 8px rgba(0, 193, 106, 0.25)' : 'var(--shadow-sm)',
        }}>
          {text || ' '}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--ink-500)',
          marginTop: 4,
          textAlign: own ? 'right' : 'left',
          padding: '0 4px',
        }}>
          {timeString}
        </div>
      </div>
    </div>
  )
}
