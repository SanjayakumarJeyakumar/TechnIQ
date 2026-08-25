import { useNavigate } from 'react-router-dom'

export default function ConversationListItem({ conversation }) {
  const navigate = useNavigate()
  const initial = (conversation.other_user_name || '?').trim().charAt(0).toUpperCase()
  const hasUnread = conversation.unread_count > 0

  return (
    <button
      onClick={() => navigate(`/messages/${conversation.conversation_id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', width: '100%',
        padding: 'var(--sp-3) var(--sp-4)', background: 'var(--surface-1)',
        border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
        textAlign: 'left',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', overflow: 'hidden', position: 'relative',
      }}>
        {conversation.other_user_avatar ? (
          <img src={conversation.other_user_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontWeight: 600, color: 'var(--violet-800)' }}>{initial}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
          <span style={{ fontWeight: hasUnread ? 600 : 500 }}>{conversation.other_user_name}</span>
          {conversation.last_message_at && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', whiteSpace: 'nowrap' }}>
              {new Date(conversation.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <p style={{
          margin: 0, fontSize: 'var(--text-sm)',
          color: hasUnread ? 'var(--ink-900)' : 'var(--ink-500)',
          fontWeight: hasUnread ? 500 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {conversation.last_message || 'Say hello 👋'}
        </p>
      </div>

      {hasUnread && (
        <span style={{
          minWidth: 20, height: 20, borderRadius: 'var(--radius-pill)',
          background: 'var(--violet-600)', color: '#fff', fontSize: 'var(--text-xs)',
          fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 6px', flexShrink: 0,
        }}>
          {conversation.unread_count}
        </span>
      )}
    </button>
  )
}
