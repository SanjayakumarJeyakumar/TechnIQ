import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '../services/notifications'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const TYPE_CONFIG = {
  request_received: {
    icon: '📩',
    label: 'Learning Request',
    targetRoute: '/requests',
    color: 'var(--amber-800)',
    bg: 'var(--amber-50)',
  },
  request_accepted: {
    icon: '🎉',
    label: 'Request Accepted',
    targetRoute: '/messages',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
  },
  request_rejected: {
    icon: '✕',
    label: 'Request Declined',
    targetRoute: '/requests',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
  },
  new_message: {
    icon: '💬',
    label: 'New Message',
    targetRoute: '/messages',
    color: 'var(--violet-600)',
    bg: 'var(--violet-50)',
  },
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [status, setStatus] = useState('loading') // loading | done | error
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = async (showLoading = true) => {
    if (!user) return
    if (showLoading) setStatus('loading')
    try {
      const data = await fetchNotifications(user.id)
      setNotifications(data)
      setStatus('done')
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setStatus('error')
    }
  }

  useEffect(() => {
    loadNotifications(true)

    if (!user?.id) return
    const unsubscribe = subscribeToNotifications(user.id, () => {
      loadNotifications(false)
    })

    return () => unsubscribe()
  }, [user?.id])

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }

    const config = TYPE_CONFIG[notif.type] || { targetRoute: '/requests' }
    navigate(config.targetRoute)
  }

  const handleMarkAllRead = async () => {
    if (!user || markingAll) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed to mark all read:', err)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (status === 'loading') {
    return (
      <div style={{ padding: 'var(--sp-6) 0' }}>
        <LoadingSpinner label="Loading notifications…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="Couldn't load notifications"
        description="Please check your connection and try again."
        action={
          <button
            onClick={() => loadNotifications(true)}
            style={{
              padding: 'var(--sp-2) var(--sp-4)', background: 'var(--violet-600)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--sp-4)',
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', margin: 'var(--sp-1) 0 0 0' }}>
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
              : 'You are all caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{
              background: 'none', border: '1px solid var(--ink-100)',
              padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--violet-600)',
              cursor: markingAll ? 'not-allowed' : 'pointer',
            }}
          >
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When someone sends you a learning request, accepts an invite, or chats, you'll see it here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || {
              icon: '🔔',
              label: 'Notification',
              targetRoute: '/requests',
              color: 'var(--ink-900)',
              bg: 'var(--surface-2)',
            }

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)',
                  padding: 'var(--sp-4)',
                  background: notif.is_read ? 'var(--surface-1)' : 'var(--surface-0)',
                  border: '1px solid var(--ink-100)',
                  borderLeft: notif.is_read ? '1px solid var(--ink-100)' : '4px solid var(--violet-600)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Type Icon Badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: config.bg, color: config.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {config.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      color: config.color, textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {config.label}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p style={{
                    margin: 'var(--sp-1) 0 0 0',
                    fontSize: 'var(--text-sm)',
                    color: notif.is_read ? 'var(--ink-700)' : 'var(--ink-900)',
                    fontWeight: notif.is_read ? 400 : 600,
                    lineHeight: 1.5,
                  }}>
                    {notif.message}
                  </p>
                </div>

                {/* Unread indicator dot */}
                {!notif.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--violet-600)', flexShrink: 0, marginTop: 6,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
