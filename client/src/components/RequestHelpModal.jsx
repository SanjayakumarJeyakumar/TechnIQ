import { useState } from 'react'
import Modal from './Modal'
import { createRequest } from '../services/requests'

export default function RequestHelpModal({ student, skills, onClose, onSent }) {
  const [skillId, setSkillId] = useState(skills[0]?.id || '')
  const defaultMessage = skills[0]
    ? `Hi ${student.name.split(' ')[0]}, I'd love your help learning ${skills[0].name}. Could you help me out?`
    : ''
  const [message, setMessage] = useState(defaultMessage)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleSkillChange(newSkillId) {
    setSkillId(newSkillId)
    const skill = skills.find((s) => s.id === newSkillId)
    // Refresh the suggested message to match the newly picked skill, but
    // only if the person hasn't already customized it away from a previous
    // auto-fill for a different skill.
    const wasAutoFilled = skills.some(
      (s) => message === `Hi ${student.name.split(' ')[0]}, I'd love your help learning ${s.name}. Could you help me out?`
    )
    if (wasAutoFilled && skill) {
      setMessage(`Hi ${student.name.split(' ')[0]}, I'd love your help learning ${skill.name}. Could you help me out?`)
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
    <Modal title={`Request help from ${student.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="req-skill">Skill</label>
        <select
          id="req-skill"
          value={skillId}
          onChange={(e) => handleSkillChange(e.target.value)}
          style={inputStyle}
        >
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>{skill.name}</option>
          ))}
        </select>

        <label style={{ ...labelStyle, marginTop: 'var(--sp-4)' }} htmlFor="req-message">Message</label>
        <textarea
          id="req-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={500}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--sp-2)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', marginTop: 'var(--sp-5)', padding: 'var(--sp-3) var(--sp-4)',
            background: submitting ? 'var(--ink-100)' : 'var(--violet-600)',
            color: submitting ? 'var(--ink-500)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Sending…' : 'Send request'}
        </button>
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
