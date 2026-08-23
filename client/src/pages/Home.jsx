import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { profile } = useAuth()
  return (
    <div>
      <section style={{
        background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--sp-7) var(--sp-6)',
        marginBottom: 'var(--sp-6)',
      }}>
        <h1>Learn together. Grow together.</h1>
        <p style={{ maxWidth: 480 }}>
          {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}. ` : ''}
          Find students from your college who can help you learn the skills you care about.
        </p>
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <input
            placeholder="What do you want to learn?"
            style={{
              width: '100%', maxWidth: 420, padding: 'var(--sp-3) var(--sp-4)',
              border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--text-base)',
            }}
          />
        </div>
      </section>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
        Recommended students, popular skills, and the leaderboard render here in Phase 5–9.
      </p>
    </div>
  )
}
