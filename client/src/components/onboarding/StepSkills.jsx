import SkillSelector from '../SkillSelector'

export default function StepSkills({ allSkills, selectedIds, onChange }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>What skills do you know?</h2>
      <p>Select everything you're comfortable with — you can update this anytime.</p>
      <SkillSelector allSkills={allSkills} selectedIds={selectedIds} onChange={onChange} />
    </div>
  )
}
