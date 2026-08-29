export default function StepWelcome({ name }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-4)' }}>
        <img
          src="/technIQ-logo.png"
          alt="TechnIQ"
          style={{ height: 36, width: 'auto', objectFit: 'contain' }}
        />
      </div>
      <h1 style={{ fontSize: 'var(--text-xl)', color: '#FFFFFF', marginBottom: 'var(--sp-2)' }}>
        {name ? `Welcome, ${name.split(' ')[0]}!` : 'Welcome to TechnIQ.'}
      </h1>
      <p style={{ maxWidth: 380, margin: '0 auto', color: 'var(--ink-500)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
        A few quick questions so we can connect you with the right students at your college. Takes about a minute.
      </p>
    </div>
  )
}
