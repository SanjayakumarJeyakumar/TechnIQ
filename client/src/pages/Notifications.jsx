import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '../services/notifications'
import EmptyState from '../components/EmptyState'

const TYPE_CONFIG = {
  request_received: {
    icon: '📩',
    label: 'Learning Request',
    targetRoute: '/requests',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  request_accepted: {
    icon: '🎉',
    label: 'Request Accepted',
    targetRoute: '/messages',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  request_rejected: {
    icon: '✕',
    label: 'Request Declined',
    targetRoute: '/requests',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
  new_message: {
    icon: '💬',
    label: 'New Message',
    targetRoute: '/messages',
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.15)',
  },
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [status, setStatus] = useState('loading') // loading | done | error
  const [markingAll, setMarkingAll] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadNotifications = useCallback(async (showLoading = true) => {
    if (!user?.id) return
    if (showLoading) setStatus('loading')

    try {
      const data = await fetchNotifications(user.id)
      if (isMounted.current) {
        setNotifications(Array.isArray(data) ? data : [])
        setStatus('done')
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
      if (isMounted.current) {
        setStatus('error')
      }
    }
  }, [user?.id])

  useEffect(() => {
    loadNotifications(true)

    if (!user?.id) return
    const unsubscribe = subscribeToNotifications(user.id, () => {
      if (isMounted.current) {
        loadNotifications(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id, loadNotifications])

  const handleNotificationClick = async (notif) => {
    if (!notif) return

    if (!notif.is_read && notif.id) {
      try {
        await markNotificationRead(notif.id)
        if (isMounted.current) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
          )
        }
      } catch (err) {
        console.warn('Failed to mark read:', err)
      }
    }

    const config = TYPE_CONFIG[notif.type] || { targetRoute: '/requests' }
    navigate(config.targetRoute)
  }

  const handleMarkAllRead = async () => {
    if (!user?.id || markingAll) return
    setMarkingAll(true)
    try {
      await markAllNotificationsRead(user.id)
      if (isMounted.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error('Failed to mark all read:', err)
    } finally {
      if (isMounted.current) {
        setMarkingAll(false)
      }
    }
  }

  const safeNotifications = Array.isArray(notifications) ? notifications : []
  const unreadCount = safeNotifications.filter((n) => Boolean(n && !n.is_read)).length

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 'var(--sp-2)',
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', color: '#FFFFFF', margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', margin: 'var(--sp-1) 0 0 0' }}>
            {status === 'loading'
              ? 'Checking for campus updates…'
              : unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                : 'You are all caught up!'}
          </p>
        </div>

        {status === 'done' && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary"
            style={{ padding: '6px 14px', height: 34, fontSize: 'var(--text-xs)' }}
          >
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton" style={{ height: 74, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {/* Error State with Retry Button */}
      {status === 'error' && (
        <EmptyState
          title="Unable to load notifications"
          description="We could not fetch your campus notifications right now. Please check your connection."
          action={
            <button
              onClick={() => loadNotifications(true)}
              className="btn-brand-primary"
              style={{ marginTop: 'var(--sp-3)', padding: '0 20px', height: 40 }}
            >
              Retry
            </button>
          }
        />
      )}

      {/* Empty State */}
      {status === 'done' && safeNotifications.length === 0 && (
        <EmptyState
          title="No notifications yet"
          description="When someone sends you a learning request, accepts an invite, or chats, you'll see it here."
        />
      )}

      {/* Notifications List */}
      {status === 'done' && safeNotifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {safeNotifications.map((notif) => {
            if (!notif || !notif.id) return null

            const config = TYPE_CONFIG[notif.type] || {
              icon: '🔔',
              label: 'Update',
              targetRoute: '/requests',
              color: '#00C16A',
              bg: 'rgba(0, 193, 106, 0.15)',
            }

            const safeDate = notif.created_at ? new Date(notif.created_at) : new Date()
            const timeFormatted = isNaN(safeDate.getTime())
              ? 'Recently'
              : safeDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-4)',
                  background: notif.is_read ? 'var(--surface-1)' : 'rgba(0, 193, 106, 0.05)',
                  border: '1px solid var(--surface-3)',
                  borderLeft: notif.is_read ? '1px solid var(--surface-3)' : '4px solid var(--brand-primary)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--surface-3)'
                  e.currentTarget.style.borderLeft = notif.is_read ? '1px solid var(--surface-3)' : '4px solid var(--brand-primary)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Type Icon Badge */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: config.bg, color: config.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                }}>
                  {config.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: config.color, textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {config.label}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
                      {timeFormatted}
                    </span>
                  </div>

                  <p style={{
                    margin: 'var(--sp-1) 0 0 0',
                    fontSize: 'var(--text-sm)',
                    color: notif.is_read ? 'var(--ink-700)' : '#FFFFFF',
                    fontWeight: notif.is_read ? 400 : 600,
                    lineHeight: 1.5,
                  }}>
                    {notif.message || 'New activity on TechnIQ'}
                  </p>
                </div>

                {/* Unread indicator dot */}
                {!notif.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--brand-primary)', flexShrink: 0, marginTop: 6,
                    boxShadow: '0 0 8px rgba(0, 193, 106, 0.8)',
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
