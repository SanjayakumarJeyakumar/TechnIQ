import { useNavigate } from 'react-router-dom'

export default function ConversationListItem({ conversation }) {
  const navigate = useNavigate()
  const initial = (conversation.other_user_name || '?').trim().charAt(0).toUpperCase()
  const hasUnread = conversation.unread_count > 0

  return (
    <button
      onClick={() => navigate(`/messages/${conversation.conversation_id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        width: '100%',
        padding: 'var(--sp-3) var(--sp-4)',
        background: hasUnread ? 'rgba(0, 193, 106, 0.06)' : 'var(--surface-1)',
        border: hasUnread ? '1px solid var(--brand-border)' : '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'left',
        transition: 'all var(--dur-fast) var(--ease-out)',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--brand-primary)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = hasUnread ? 'var(--brand-border)' : 'var(--surface-3)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'var(--brand-subtle)',
        border: '1.5px solid var(--surface-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {conversation.other_user_avatar ? (
          <img src={conversation.other_user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 'var(--text-base)' }}>
            {initial}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span style={{ fontWeight: hasUnread ? 700 : 600, color: '#FFFFFF', fontSize: 'var(--text-base)' }}>
            {conversation.other_user_name}
          </span>
          {conversation.last_message_at && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
              {new Date(conversation.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <p style={{
          margin: '2px 0 0 0',
          fontSize: 'var(--text-sm)',
          color: hasUnread ? '#FFFFFF' : 'var(--ink-500)',
          fontWeight: hasUnread ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {conversation.last_message || 'Say hello 👋'}
        </p>
      </div>

      {hasUnread && (
        <span style={{
          minWidth: 20,
          height: 20,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--brand-primary)',
          color: '#0F1115',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
          flexShrink: 0,
        }}>
          {conversation.unread_count}
        </span>
      )}
    </button>
  )
}
