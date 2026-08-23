import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/search', label: 'Find students' },
  { to: '/ai-guide', label: 'AI Guide' },
  { to: '/messages', label: 'Messages' },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--surface-1)', borderBottom: '1px solid var(--ink-100)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
          <Logomark />
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: 'var(--text-lg)', color: 'var(--ink-900)',
          }}>
            TechnIQ
          </span>
        </NavLink>

        <nav style={{ display: 'flex', gap: 'var(--sp-5)' }}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={({ isActive }) => ({
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: isActive ? 'var(--violet-600)' : 'var(--ink-700)',
                textDecoration: 'none',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <NavLink to="/notifications" aria-label="Notifications" style={{ color: 'var(--ink-700)' }}>
            <BellIcon />
          </NavLink>
          <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', textDecoration: 'none' }}>
            <Avatar name={profile?.name} url={profile?.avatar_url} />
          </NavLink>
          <button
            onClick={signOut}
            style={{
              background: 'none', border: 'none', fontSize: 'var(--text-sm)',
              color: 'var(--ink-500)', padding: 'var(--sp-1) var(--sp-2)',
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}

/* Signature mark: three nodes connected by lines — the peer-to-peer
   skill-exchange idea rendered as a tiny mark, reused nowhere else in the
   product so it stays a signature rather than a motif that dilutes. */
function Logomark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <line x1="7" y1="20" x2="14" y2="8" stroke="var(--violet-400)" strokeWidth="1.5" />
      <line x1="21" y1="20" x2="14" y2="8" stroke="var(--violet-400)" strokeWidth="1.5" />
      <line x1="7" y1="20" x2="21" y2="20" stroke="var(--ink-300)" strokeWidth="1.5" />
      <circle cx="14" cy="8" r="3.5" fill="var(--violet-600)" />
      <circle cx="7" cy="20" r="3" fill="var(--amber-400)" />
      <circle cx="21" cy="20" r="3" fill="var(--amber-400)" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.5c-2.3 0-4 1.9-4 4.2v2.6c0 .5-.2 1-.5 1.4L4 12.5h12l-1.5-1.8a2.2 2.2 0 01-.5-1.4V6.7c0-2.3-1.7-4.2-4-4.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 15.3a2 2 0 004 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function Avatar({ name, url }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  if (url) {
    return <img src={url} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: 'var(--violet-50)',
      color: 'var(--violet-800)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 600,
    }}>
      {initial}
    </div>
  )
}
