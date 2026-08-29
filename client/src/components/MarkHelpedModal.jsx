import { useState } from 'react'
import Modal from './Modal'
import { recordStudentHelped } from '../services/students'

export default function MarkHelpedModal({ student, skills, onClose, onHelped }) {
  const [skillId, setSkillId] = useState(skills[0]?.id || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!skillId) {
      setError('Please select a skill they helped you with.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const result = await recordStudentHelped(student.id, skillId)
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

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', margin: 0, fontWeight: 500 }}>
            ✕ {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !skillId}
            style={{
              flex: 2,
              padding: 'var(--sp-3) var(--sp-4)',
              background: submitting ? 'var(--surface-3)' : 'var(--amber-400)',
              color: submitting ? 'var(--ink-500)' : '#0F1115',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 'var(--text-sm)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            {submitting ? 'Confirming…' : '★ Confirm Help'}
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
