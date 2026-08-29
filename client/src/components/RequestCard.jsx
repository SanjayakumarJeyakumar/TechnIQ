import { useNavigate } from 'react-router-dom'
import { REQUEST_STATUS_LABELS } from '../lib/constants'

const STATUS_COLORS = {
  pending: { bg: 'var(--amber-50)', fg: 'var(--amber-800)', border: 'var(--amber-400)' },
  accepted: { bg: 'var(--success-bg)', fg: 'var(--success)', border: 'var(--success)' },
  rejected: { bg: 'var(--danger-bg)', fg: 'var(--danger)', border: 'var(--danger)' },
  cancelled: { bg: 'var(--surface-3)', fg: 'var(--ink-500)', border: 'var(--surface-3)' },
}

export default function RequestCard({ request, direction, onAccept, onReject, onCancel, busy }) {
  const navigate = useNavigate()
  const otherPerson = direction === 'received' ? request.sender : request.receiver
  const colors = STATUS_COLORS[request.status] || STATUS_COLORS.pending
  const initial = (otherPerson?.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--surface-3)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--sp-4) var(--sp-5)',
      display: 'flex',
      gap: 'var(--sp-4)',
      alignItems: 'flex-start',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Clickable Avatar to view student profile */}
      <button
        type="button"
        onClick={() => navigate(`/students/${otherPerson?.id}`)}
        title={`View ${otherPerson?.name}'s profile`}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          flexShrink: 0,
          border: '1.5px solid var(--surface-3)',
          background: 'var(--brand-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {otherPerson?.avatar_url ? (
          <img src={otherPerson.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 'var(--text-sm)' }}>{initial}</span>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <div>
            <button
              type="button"
              onClick={() => navigate(`/students/${otherPerson?.id}`)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontWeight: 600,
                color: '#FFFFFF',
                fontSize: 'var(--text-base)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {otherPerson?.name}
            </button>
            <span style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
              {' '}{direction === 'received' ? 'wants help with' : 'help with'}{' '}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{request.skill?.name}</span>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-pill)',
            background: colors.bg,
            color: colors.fg,
            border: `1px solid ${colors.border}`,
            whiteSpace: 'nowrap',
          }}>
            {REQUEST_STATUS_LABELS[request.status]}
          </span>
        </div>

        {request.message && (
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--ink-700)',
            margin: 'var(--sp-2) 0',
            background: 'var(--surface-2)',
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--brand-primary)',
          }}>
            "{request.message}"
          </p>
        )}

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', margin: 'var(--sp-2) 0 0 0' }}>
          Sent {new Date(request.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </p>

        {direction === 'received' && request.status === 'pending' && (
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <button
              onClick={() => onAccept(request.id)}
              disabled={busy}
              className="btn-brand-primary"
              style={{ padding: '6px 16px', height: 36, fontSize: 'var(--text-xs)' }}
            >
              Accept Request
            </button>
            <button
              onClick={() => onReject(request.id)}
              disabled={busy}
              className="btn-secondary"
              style={{ padding: '6px 16px', height: 36, fontSize: 'var(--text-xs)' }}
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
              className="btn-secondary"
              style={{ padding: '6px 14px', height: 34, fontSize: 'var(--text-xs)' }}
            >
              Cancel request
            </button>
          </div>
        )}

        {request.status === 'accepted' && (
          <button
            onClick={() => navigate('/messages')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-primary)',
              marginTop: 'var(--sp-3)',
              padding: 0,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Open conversation →
          </button>
        )}
      </div>
    </div>
  )
}
