export default function StepWelcome({ name }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
      <svg width="44" height="44" viewBox="0 0 28 28" aria-hidden="true" style={{ margin: '0 auto var(--sp-4)' }}>
        <line x1="7" y1="20" x2="14" y2="8" stroke="var(--violet-400)" strokeWidth="1.5" />
        <line x1="21" y1="20" x2="14" y2="8" stroke="var(--violet-400)" strokeWidth="1.5" />
        <line x1="7" y1="20" x2="21" y2="20" stroke="var(--ink-300)" strokeWidth="1.5" />
        <circle cx="14" cy="8" r="3.5" fill="var(--violet-600)" />
        <circle cx="7" cy="20" r="3" fill="var(--amber-400)" />
        <circle cx="21" cy="20" r="3" fill="var(--amber-400)" />
      </svg>
      <h1 style={{ fontSize: 'var(--text-lg)' }}>
        {name ? `Welcome, ${name.split(' ')[0]}.` : 'Welcome to TechnIQ.'}
      </h1>
      <p style={{ maxWidth: 320, margin: '0 auto' }}>
        A few quick questions so we can connect you with the right students at
        your college. Takes about a minute.
      </p>
    </div>
  )
}
