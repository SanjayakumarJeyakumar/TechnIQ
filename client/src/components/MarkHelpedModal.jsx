import { useState } from 'react'
import Modal from './Modal'
import { recordStudentHelped } from '../services/students'
import { ENDORSEMENT_TAGS } from '../constants/endorsements'

export default function MarkHelpedModal({ student, skills, onClose, onHelped }) {
  const [skillId, setSkillId] = useState(skills[0]?.id || '')
  const [selectedTags, setSelectedTags] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!skillId) {
      setError('Please select a skill they helped you with.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const result = await recordStudentHelped(student.id, skillId, selectedTags)
      onHelped(result)
    } catch (err) {
      console.error('Failed to record helped status:', err)
      setError(err.message || 'Unable to record help confirmation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Confirm ${student.name.split(' ')[0]} helped you`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-700)', margin: 0, lineHeight: 1.6 }}>
          Did <strong style={{ color: '#FFFFFF' }}>{student.name}</strong> teach or assist you with a skill? Confirming this helps recognize their contribution on your campus leaderboard!
        </p>

        {/* Skill Selection */}
        <div>
          <label style={labelStyle} htmlFor="helped-skill">Which skill did they teach or assist with?</label>
          <select
            id="helped-skill"
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="input-dark"
            disabled={submitting}
            style={{ cursor: 'pointer' }}
          >
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name} ({skill.category})
              </option>
            ))}
          </select>
        </div>

        {/* Optional Peer Endorsements */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
            <label style={{ ...labelStyle, margin: 0 }}>
              Peer Endorsements <span style={{ textTransform: 'none', color: 'var(--ink-500)', fontWeight: 400 }}>(Optional)</span>
            </label>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                style={{ background: 'none', border: 'none', color: 'var(--ink-500)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
              >
                Clear selection
              </button>
            )}
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', margin: '0 0 var(--sp-2) 0' }}>
            Highlight what made learning with {student.name.split(' ')[0]} great:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            {ENDORSEMENT_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  disabled={submitting}
                  title={tag.description}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: isSelected ? 'var(--brand-subtle)' : 'var(--surface-2)',
                    border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--surface-3)',
                    color: isSelected ? 'var(--brand-primary)' : 'var(--ink-700)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                    minHeight: 34,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--ink-500)'
                      e.currentTarget.style.color = '#FFFFFF'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--surface-3)'
                      e.currentTarget.style.color = 'var(--ink-700)'
                    }
                  }}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontWeight: 500 }}>
            ✕ {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
            style={{ flex: '1 1 100px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !skillId}
            style={{
              flex: '2 1 180px',
              padding: 'var(--sp-3) var(--sp-4)',
              background: submitting ? 'var(--surface-3)' : selectedTags.length > 0 ? 'var(--brand-primary)' : 'var(--amber-400)',
              color: submitting ? 'var(--ink-500)' : '#0F1115',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: selectedTags.length > 0 ? '0 2px 8px rgba(0, 193, 106, 0.3)' : '0 2px 8px rgba(245, 158, 11, 0.3)',
              minHeight: 44,
            }}
          >
            {submitting
              ? 'Confirming…'
              : selectedTags.length > 0
              ? `★ Confirm & Endorse (${selectedTags.length})`
              : '★ Skip & Confirm Help'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--ink-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 'var(--sp-1)',
}
