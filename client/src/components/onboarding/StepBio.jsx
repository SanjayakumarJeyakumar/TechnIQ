const MAX_BIO_LENGTH = 200

export default function StepBio({ bio, setBio }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>A Short Bio</h2>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
        One or two lines about your interests — displayed on your campus profile card.
      </p>
      <textarea
        value={bio}
        maxLength={MAX_BIO_LENGTH}
        onChange={(e) => setBio(e.target.value)}
        placeholder="e.g. CS junior passionate about frontend dev, React hooks, and building fast UI components."
        rows={4}
        className="input-dark"
        style={{ resize: 'vertical' }}
      />
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textAlign: 'right', marginTop: 'var(--sp-1)' }}>
        {bio.length}/{MAX_BIO_LENGTH}
      </p>
    </div>
  )
}
