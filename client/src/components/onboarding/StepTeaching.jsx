export default function StepTeaching({ canTeach, setCanTeach }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>Are you willing to teach?</h2>
      <p>Only students who opt in show up when someone searches for a skill you know.</p>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
        <OptionCard
          selected={canTeach === true}
          onClick={() => setCanTeach(true)}
          title="Yes, I'll teach"
          description="I'm open to helping other students who want to learn what I know."
        />
        <OptionCard
          selected={canTeach === false}
          onClick={() => setCanTeach(false)}
          title="Not right now"
          description="I mainly want to learn from others for now. I can change this later."
        />
      </div>
    </div>
  )
}

function OptionCard({ selected, onClick, title, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, textAlign: 'left', padding: 'var(--sp-4)',
        border: `1.5px solid ${selected ? 'var(--violet-600)' : 'var(--ink-100)'}`,
        borderRadius: 'var(--radius-md)',
        background: selected ? 'var(--violet-50)' : 'var(--surface-1)',
      }}
    >
      <div style={{
        fontWeight: 600, fontSize: 'var(--text-base)',
        color: selected ? 'var(--violet-800)' : 'var(--ink-900)', marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)' }}>{description}</div>
    </button>
  )
}
