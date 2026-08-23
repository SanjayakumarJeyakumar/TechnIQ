const MAX_BIO_LENGTH = 200

export default function StepBio({ bio, setBio }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>A short bio</h2>
      <p>One or two lines about you — shown on your profile.</p>
      <textarea
        value={bio}
        maxLength={MAX_BIO_LENGTH}
        onChange={(e) => setBio(e.target.value)}
        placeholder="e.g. CS junior into frontend dev, always down to pair on a React bug."
        rows={4}
        style={{
          width: '100%', padding: 'var(--sp-3) var(--sp-4)',
          border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-base)', resize: 'vertical', fontFamily: 'inherit',
          background: 'var(--surface-1)', color: 'var(--ink-900)',
        }}
      />
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textAlign: 'right' }}>
        {bio.length}/{MAX_BIO_LENGTH}
      </p>
    </div>
  )
}
