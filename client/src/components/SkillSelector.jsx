import { useMemo, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

export default function SkillSelector({ allSkills, selectedIds, onChange }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 150)

  const selectedSkills = useMemo(
    () => allSkills.filter((s) => selectedIds.has(s.id)),
    [allSkills, selectedIds]
  )

  const groupedResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    const filtered = q
      ? allSkills.filter((s) => s.name.toLowerCase().includes(q))
      : allSkills

    const groups = {}
    for (const skill of filtered) {
      if (!groups[skill.category]) groups[skill.category] = []
      groups[skill.category].push(skill)
    }
    return groups
  }, [allSkills, debouncedQuery])

  function toggle(skillId) {
    const next = new Set(selectedIds)
    if (next.has(skillId)) next.delete(skillId)
    else next.add(skillId)
    onChange(next)
  }

  return (
    <div>
      {selectedSkills.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)',
          marginBottom: 'var(--sp-4)',
          background: 'var(--surface-2)',
          padding: 'var(--sp-3)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--surface-3)',
        }}>
          {selectedSkills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => toggle(skill.id)}
              style={chipStyle(true)}
              aria-label={`Remove ${skill.name}`}
              type="button"
            >
              {skill.name}
              <span aria-hidden="true" style={{ marginLeft: 6, opacity: 0.8, fontWeight: 700 }}>×</span>
            </button>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search skills (e.g. React, Python, UI Design, SQL)…"
        className="input-dark"
        style={{ marginBottom: 'var(--sp-4)' }}
      />

      <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 'var(--sp-1)' }}>
        {Object.keys(groupedResults).length === 0 && (
          <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--sp-4)' }}>
            No skills match "{debouncedQuery}".
          </p>
        )}
        {Object.entries(groupedResults).map(([category, skills]) => (
          <div key={category} style={{ marginBottom: 'var(--sp-4)' }}>
            <h4 style={{
              fontSize: 'var(--text-xs)', textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'var(--brand-primary)',
              marginBottom: 'var(--sp-2)', fontWeight: 700,
            }}>
              {category}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              {skills.map((skill) => {
                const isSelected = selectedIds.has(skill.id)
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggle(skill.id)}
                    style={chipStyle(isSelected)}
                  >
                    {skill.name} {isSelected ? '✓' : '+'}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function chipStyle(selected) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: 'var(--radius-pill)',
    border: selected ? '1px solid var(--brand-primary)' : '1px solid var(--surface-3)',
    background: selected ? 'var(--brand-primary)' : 'var(--surface-2)',
    color: selected ? '#0F1115' : 'var(--ink-700)',
    fontSize: 'var(--text-xs)',
    fontWeight: selected ? 700 : 500,
    cursor: 'pointer',
    transition: 'all var(--dur-fast) var(--ease-out)',
  }
}
