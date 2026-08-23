import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--sp-7) var(--sp-6)',
      boxShadow: 'var(--shadow-md)', textAlign: 'center',
    }}>
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <svg width="40" height="40" viewBox="0 0 28 28" aria-hidden="true" style={{ margin: '0 auto' }}>
          <line x1="7" y1="20" x2="14" y2="8" stroke="var(--violet-400)" strokeWidth="1.5" />
          <line x1="21" y1="20" x2="14" y2="8" stroke="var(--violet-400)" strokeWidth="1.5" />
          <line x1="7" y1="20" x2="21" y2="20" stroke="var(--ink-300)" strokeWidth="1.5" />
          <circle cx="14" cy="8" r="3.5" fill="var(--violet-600)" />
          <circle cx="7" cy="20" r="3" fill="var(--amber-400)" />
          <circle cx="21" cy="20" r="3" fill="var(--amber-400)" />
        </svg>
      </div>
      <h1 style={{ fontSize: 'var(--text-lg)' }}>Welcome to TechnIQ</h1>
      <p>Find students at your college who can teach you what you want to learn.</p>
      <button
        onClick={signInWithGoogle}
        style={{
          width: '100%', marginTop: 'var(--sp-4)', padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--violet-600)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: 'var(--text-base)',
        }}
      >
        Continue with Google
      </button>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginTop: 'var(--sp-4)' }}>
        Use your college email so we can find your campus automatically.
      </p>
    </div>
  )
}
