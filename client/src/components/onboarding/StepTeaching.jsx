export default function StepTeaching({ canTeach, setCanTeach }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Are you willing to teach?</h2>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
        Only students who opt in show up when someone searches for a skill you know.
      </p>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <OptionCard
          selected={canTeach === true}
          onClick={() => setCanTeach(true)}
          title="Yes, I'll teach & help"
          description="I'm open to helping classmates who want to learn skills I have experience with."
        />
        <OptionCard
          selected={canTeach === false}
          onClick={() => setCanTeach(false)}
          title="Not right now"
          description="I mainly want to find mentors and learn from others for now."
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
        flex: '1 1 200px',
        textAlign: 'left',
        padding: 'var(--sp-4)',
        border: selected ? '1.5px solid var(--brand-primary)' : '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-lg)',
        background: selected ? 'var(--brand-subtle)' : 'var(--surface-2)',
        cursor: 'pointer',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}
    >
      <div style={{
        fontWeight: 700,
        fontSize: 'var(--text-base)',
        color: selected ? 'var(--brand-primary)' : '#FFFFFF',
        marginBottom: 4,
      }}>
        {title} {selected && '✓'}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', lineHeight: 1.5 }}>
        {description}
      </div>
    </button>
  )
}
