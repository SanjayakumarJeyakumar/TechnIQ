import { useNavigate } from 'react-router-dom'
import { REQUEST_STATUS_LABELS } from '../lib/constants'

const STATUS_COLORS = {
  pending: { bg: 'var(--amber-50)', fg: 'var(--amber-800)' },
  accepted: { bg: 'var(--success-bg)', fg: 'var(--success)' },
  rejected: { bg: 'var(--danger-bg)', fg: 'var(--danger)' },
  cancelled: { bg: 'var(--surface-2)', fg: 'var(--ink-500)' },
}

export default function RequestCard({ request, direction, onAccept, onReject, onCancel, busy }) {
  const navigate = useNavigate()
  const otherPerson = direction === 'received' ? request.sender : request.receiver
  const colors = STATUS_COLORS[request.status]
  const initial = (otherPerson?.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)',
      display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start',
    }}>
      <button
        onClick={() => navigate(`/students/${otherPerson.id}`)}
        style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: 'none',
          background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden', padding: 0,
        }}
      >
        {otherPerson?.avatar_url ? (
          <img src={otherPerson.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontWeight: 600, color: 'var(--violet-800)', fontSize: 'var(--text-sm)' }}>{initial}</span>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-2)' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{otherPerson?.name}</span>
            <span style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
              {' '}{direction === 'received' ? 'wants help with' : 'help with'}{' '}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--violet-600)' }}>{request.skill?.name}</span>
          </div>
          <span style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px',
            borderRadius: 'var(--radius-pill)', background: colors.bg, color: colors.fg,
            whiteSpace: 'nowrap',
          }}>
            {REQUEST_STATUS_LABELS[request.status]}
          </span>
        </div>

        {request.message && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-700)', margin: 'var(--sp-2) 0' }}>
            "{request.message}"
          </p>
        )}

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', margin: 0 }}>
          {new Date(request.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>

        {direction === 'received' && request.status === 'pending' && (
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
            <button
              onClick={() => onAccept(request.id)}
              disabled={busy}
              style={actionButtonStyle('var(--violet-600)', '#fff')}
            >
              Accept
            </button>
            <button
              onClick={() => onReject(request.id)}
              disabled={busy}
              style={actionButtonStyle('var(--surface-2)', 'var(--ink-700)')}
            >
              Decline
            </button>
          </div>
        )}

        {direction === 'sent' && request.status === 'pending' && (
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <button
              onClick={() => onCancel(request.id)}
              disabled={busy}
              style={actionButtonStyle('var(--surface-2)', 'var(--ink-700)')}
            >
              Cancel request
            </button>
          </div>
        )}

        {request.status === 'accepted' && (
          <button
            onClick={() => navigate('/messages')}
            style={{ ...actionButtonStyle('none', 'var(--violet-600)'), marginTop: 'var(--sp-3)', padding: 0, border: 'none' }}
          >
            Go to messages →
          </button>
        )}
      </div>
    </div>
  )
}

function actionButtonStyle(bg, fg) {
  return {
    padding: 'var(--sp-2) var(--sp-4)', background: bg, color: fg,
    border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 500,
  }
}
