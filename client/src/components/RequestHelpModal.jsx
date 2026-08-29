import { useState } from 'react'
import Modal from './Modal'
import { createRequest } from '../services/requests'

export default function RequestHelpModal({ student, skills, onClose, onSent }) {
  const [skillId, setSkillId] = useState(skills[0]?.id || '')
  const defaultMessage = skills[0]
    ? `Hi ${student.name.split(' ')[0]}, I'd love your help learning ${skills[0].name}. Could we connect?`
    : ''
  const [message, setMessage] = useState(defaultMessage)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleSkillChange(newSkillId) {
    setSkillId(newSkillId)
    const skill = skills.find((s) => s.id === newSkillId)
    const wasAutoFilled = skills.some(
      (s) => message === `Hi ${student.name.split(' ')[0]}, I'd love your help learning ${s.name}. Could we connect?`
    )
    if (wasAutoFilled && skill) {
      setMessage(`Hi ${student.name.split(' ')[0]}, I'd love your help learning ${skill.name}. Could we connect?`)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const request = await createRequest({ receiverId: student.id, skillId, message })
      onSent(request)
    } catch (err) {
      setError(err.message || 'Something went wrong sending your request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Request help from ${student.name.split(' ')[0]}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div>
          <label style={labelStyle} htmlFor="req-skill">Skill to Learn</label>
          <select
            id="req-skill"
            value={skillId}
            onChange={(e) => handleSkillChange(e.target.value)}
            className="input-dark"
            style={{ cursor: 'pointer' }}
          >
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle} htmlFor="req-message">Personal Message</label>
          <textarea
            id="req-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            className="input-dark"
            style={{ resize: 'vertical' }}
          />
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
            disabled={submitting}
            className="btn-brand-primary"
            style={{ flex: 2 }}
          >
            {submitting ? 'Sending…' : 'Send Request'}
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
