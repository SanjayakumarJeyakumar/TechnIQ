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
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-700)', marginBottom: 'var(--sp-4)', lineHeight: 1.5 }}>
          Did <strong>{student.name}</strong> teach or assist you with a skill? Confirming this helps recognize their contribution on your college leaderboard!
        </p>

        <label style={labelStyle} htmlFor="helped-skill">Which skill did they help you with?</label>
        <select
          id="helped-skill"
          value={skillId}
          onChange={(e) => setSkillId(e.target.value)}
          style={inputStyle}
          disabled={submitting}
        >
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name} ({skill.category})
            </option>
          ))}
        </select>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--sp-3)' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-5)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1, padding: 'var(--sp-3) var(--sp-4)',
              background: 'var(--surface-2)', color: 'var(--ink-700)',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !skillId}
            style={{
              flex: 2, padding: 'var(--sp-3) var(--sp-4)',
              background: submitting ? 'var(--ink-100)' : 'var(--amber-600)',
              color: submitting ? 'var(--ink-500)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Confirming…' : 'Confirm Help'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const inputStyle = {
  width: '100%', padding: 'var(--sp-3) var(--sp-4)',
  border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', background: 'var(--surface-0)', color: 'var(--ink-900)',
}

const labelStyle = {
  display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
  color: 'var(--ink-700)', marginBottom: 'var(--sp-2)',
}
