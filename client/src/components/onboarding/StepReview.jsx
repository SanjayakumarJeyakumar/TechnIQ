export default function StepReview({ form, collegeName, selectedSkillNames, canTeach }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>Looks good?</h2>
      <p>Here's what we'll save to your profile.</p>

      <div style={{
        background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
        padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
      }}>
        <Row label="Name" value={form.name || '—'} />
        <Row label="College" value={collegeName || '—'} />
        <Row label="Department" value={form.department || '—'} />
        <Row label="Year" value={form.year || '—'} />
        <Row label="Willing to teach" value={canTeach ? 'Yes' : 'Not right now'} />
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
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-900)' }}>{value}</div>
    </div>
  )
}
