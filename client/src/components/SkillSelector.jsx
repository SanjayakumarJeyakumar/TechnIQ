import { useMemo, useState } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

/**
 * `allSkills`: [{ id, name, category }]
 * `selectedIds`: Set<string>
 * `onChange(nextSet)`: called with a new Set on every toggle
 */
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
              <span aria-hidden="true" style={{ marginLeft: 6, opacity: 0.7 }}>×</span>
            </button>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search skills — e.g. React, Python, UI Design…"
        style={{
          width: '100%', padding: 'var(--sp-3) var(--sp-4)',
          border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-base)', marginBottom: 'var(--sp-4)',
          background: 'var(--surface-1)', color: 'var(--ink-900)',
        }}
      />

      <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 'var(--sp-1)' }}>
        {Object.keys(groupedResults).length === 0 && (
          <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
            No skills match "{debouncedQuery}".
          </p>
        )}
        {Object.entries(groupedResults).map(([category, skills]) => (
          <div key={category} style={{ marginBottom: 'var(--sp-4)' }}>
            <h4 style={{
              fontSize: 'var(--text-xs)', textTransform: 'uppercase',
              letterSpacing: '0.04em', color: 'var(--ink-500)',
              marginBottom: 'var(--sp-2)',
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
                    {skill.name}
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
    display: 'inline-flex', alignItems: 'center',
    padding: 'var(--sp-1) var(--sp-3)',
    borderRadius: 'var(--radius-pill)',
    border: `1px solid ${selected ? 'var(--violet-600)' : 'var(--ink-100)'}`,
    background: selected ? 'var(--violet-50)' : 'var(--surface-1)',
    color: selected ? 'var(--violet-800)' : 'var(--ink-700)',
    fontSize: 'var(--text-sm)',
    fontWeight: selected ? 500 : 400,
    transition: 'all var(--dur-fast) var(--ease-out)',
  }
}
