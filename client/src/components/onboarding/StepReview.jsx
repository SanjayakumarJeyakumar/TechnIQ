export default function StepReview({ form, collegeName, selectedSkillNames, canTeach }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Looks good?</h2>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>Here's what will be saved to your campus profile.</p>

      <div style={{
        background: 'var(--surface-2)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-3)',
        padding: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
      }}>
        <Row label="Name" value={form.name || '—'} />
        <Row label="College" value={collegeName || '—'} />
        <Row label="Department" value={form.department || '—'} />
        <Row label="Year" value={form.year ? `Year ${form.year}` : '—'} />
        <Row label="Willing to teach" value={canTeach ? 'Yes (Available)' : 'Not right now (Paused)'} />
        <Row
          label="Skills"
          value={selectedSkillNames.length ? selectedSkillNames.join(', ') : 'None selected yet'}
        />
        {form.bio && <Row label="Bio" value={form.bio} />}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: '#FFFFFF', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}
