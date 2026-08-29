import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--sp-8) var(--sp-4)',
      maxWidth: 480,
      margin: 'var(--sp-8) auto',
      background: 'var(--surface-1)',
      border: '1px solid var(--surface-3)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--sp-3)' }}>🪐</span>
      <h1 style={{ fontSize: 'var(--text-xl)', color: '#FFFFFF', marginBottom: 'var(--sp-2)' }}>Page Not Found</h1>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-5)' }}>
        The campus page or student resource you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn-brand-primary" style={{ display: 'inline-flex', padding: '0 24px' }}>
        Back to Campus Home
      </Link>
    </div>
  )
}
