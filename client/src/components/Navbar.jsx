import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchUnreadNotificationCount, subscribeToNotifications } from '../services/notifications'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true, icon: HomeIcon },
  { to: '/search', label: 'Find students', icon: SearchIcon },
  { to: '/requests', label: 'Requests', icon: RequestsIcon },
  { to: '/ai-guide', label: 'AI Guide', icon: SparklesIcon },
  { to: '/messages', label: 'Messages', icon: MessagesIcon },
]

export default function Navbar() {
  const { profile, user, signOut } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()

  // Hide mobile bottom nav when inside a specific DM conversation
  const isInsideDM = location.pathname.startsWith('/messages/') && location.pathname !== '/messages'

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    const refreshCount = () => {
      fetchUnreadNotificationCount(user.id)
        .then((count) => {
          if (!cancelled) setUnreadCount(count)
        })
        .catch((err) => {
          console.error('Failed to load notification count:', err)
        })
    }

    refreshCount()
    const unsubscribe = subscribeToNotifications(user.id, () => {
      refreshCount()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [user?.id])

  return (
    <>
      {/* Top Navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15, 17, 21, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--surface-3)',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo */}
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/technIQ-logo.png"
              alt="TechnIQ"
              style={{ height: 28, width: 'auto', objectFit: 'contain' }}
            />
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--brand-primary)' : 'var(--ink-700)',
                  textDecoration: 'none',
                  padding: 'var(--sp-2) var(--sp-3)',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--brand-subtle)' : 'transparent',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <NavLink
              to="/notifications"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              style={({ isActive }) => ({
                color: isActive ? 'var(--brand-primary)' : 'var(--ink-700)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--brand-subtle)' : 'var(--surface-2)',
                border: '1px solid var(--surface-3)',
                transition: 'all var(--dur-fast) var(--ease-out)',
              })}
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--danger)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid var(--bg-app)',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Your Profile">
              <Avatar name={profile?.name} url={profile?.avatar_url} />
            </NavLink>

            <NavLink
              to="/settings"
              aria-label="Settings"
              style={({ isActive }) => ({
                color: isActive ? 'var(--brand-primary)' : 'var(--ink-500)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--surface-3)',
              })}
              className="desktop-settings-link"
              title="Settings"
            >
              <SettingsIcon />
            </NavLink>

            <button
              onClick={signOut}
              className="desktop-logout-btn"
              style={{
                background: 'none', border: 'none', fontSize: 'var(--text-sm)',
                color: 'var(--ink-500)', padding: 'var(--sp-1) var(--sp-2)',
                cursor: 'pointer',
              }}
              title="Log out"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Hidden in active DMs) */}
      {!isInsideDM && (
        <nav
          className="mobile-bottom-nav"
          aria-label="Mobile Navigation"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(26, 29, 34, 0.95)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid var(--surface-3)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {NAV_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  flex: 1,
                  height: '100%',
                  minHeight: 44,
                  textDecoration: 'none',
                  color: isActive ? 'var(--brand-primary)' : 'var(--ink-500)',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'color var(--dur-fast) var(--ease-out)',
                })}
              >
                <Icon size={20} />
                <span>{link.label === 'Find students' ? 'Find' : link.label}</span>
              </NavLink>
            )
          })}
        </nav>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-logout-btn, .desktop-settings-link {
            display: none !important;
          }
          main.container {
            padding-bottom: ${isInsideDM ? 'var(--sp-4)' : 'calc(80px + env(safe-area-inset-bottom, 0px))'} !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav {
            display: none !important;
          }
          .desktop-settings-link {
            display: flex !important;
          }
        }
      `}</style>
    </>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.5c-2.3 0-4 1.9-4 4.2v2.6c0 .5-.2 1-.5 1.4L4 12.5h12l-1.5-1.8a2.2 2.2 0 01-.5-1.4V6.7c0-2.3-1.7-4.2-4-4.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 15.3a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="10" cy="10" r="3" />
      <path d="M16.2 12.5a1.5 1.5 0 00.3 1.7l.1.1a1.8 1.8 0 11-2.5 2.5l-.1-.1a1.5 1.5 0 00-1.7-.3 1.5 1.5 0 00-1 1.4v.2a1.8 1.8 0 11-3.6 0v-.2a1.5 1.5 0 00-1-1.4 1.5 1.5 0 00-1.7.3l-.1.1a1.8 1.8 0 11-2.5-2.5l.1-.1a1.5 1.5 0 00.3-1.7 1.5 1.5 0 00-1.4-1h-.2a1.8 1.8 0 110-3.6h.2a1.5 1.5 0 001.4-1 1.5 1.5 0 00-.3-1.7l-.1-.1a1.8 1.8 0 112.5-2.5l.1.1a1.5 1.5 0 001.7.3 1.5 1.5 0 001-1.4v-.2a1.8 1.8 0 113.6 0v.2a1.5 1.5 0 001 1.4 1.5 1.5 0 001.7-.3l.1-.1a1.8 1.8 0 112.5 2.5l-.1.1a1.5 1.5 0 00-.3 1.7 1.5 1.5 0 001.4 1h.2a1.8 1.8 0 110 3.6h-.2a1.5 1.5 0 00-1.4 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HomeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SearchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function RequestsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function SparklesIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.6-6.4l-2.1 2.1M8.7 15.3l-2.1 2.1m0-10.8l2.1 2.1m8.6 8.6l2.1 2.1" />
    </svg>
  )
}

function MessagesIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function Avatar({ name, url }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={34}
        height={34}
        style={{
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1.5px solid var(--brand-primary)',
        }}
      />
    )
  }
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: 'var(--brand-subtle)',
      color: 'var(--brand-primary)',
      border: '1.5px solid var(--brand-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 700,
    }}>
      {initial}
    </div>
  )
}
