import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchStudentProfile } from '../services/students'
import SkillBadge from '../components/SkillBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import RequestHelpModal from '../components/RequestHelpModal'
import MarkHelpedModal from '../components/MarkHelpedModal'

export default function StudentProfile() {
  const params = useParams()
  const targetId = params.studentId || params.userId
  const { user } = useAuth()
  const navigate = useNavigate()

  const [student, setStudent] = useState(null)
  const [status, setStatus] = useState('loading') // loading | done | error
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showHelpedModal, setShowHelpedModal] = useState(false)
  const [sentConfirmation, setSentConfirmation] = useState(null)
  const [helpedConfirmation, setHelpedConfirmation] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    if (!targetId) return

    fetchStudentProfile(targetId)
      .then((data) => {
        if (cancelled) return
        setStudent(data)
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load student profile:', err)
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [targetId])

  // Viewing your own card via a direct link — send them to the real
  // (editable) profile page instead of this read-only view.
  if (user?.id === targetId) {
    return <Navigate to="/profile" replace />
  }

  if (status === 'loading') return <LoadingSpinner label="Loading profile…" />

  if (status === 'error' || !student) {
    return (
      <EmptyState
        title="Couldn't load this profile"
        description="This student may no longer be available, or something went wrong."
      />
    )
  }

  const initial = (student.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div style={{ maxWidth: 640 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)', padding: 0 }}
      >
        ← Back
      </button>

      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)', boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            {student.avatar_url ? (
              <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 26, fontWeight: 600, color: 'var(--violet-800)' }}>{initial}</span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 2 }}>{student.name}</h1>
            <p style={{ color: 'var(--ink-500)', margin: 0, fontSize: 'var(--text-sm)' }}>
              {[student.collegeName, student.department, student.year && `Year ${student.year}`]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {student.bio && <p style={{ color: 'var(--ink-700)', lineHeight: 1.6 }}>{student.bio}</p>}

        <div style={{ display: 'flex', gap: 'var(--sp-5)', margin: 'var(--sp-4) 0', fontSize: 'var(--text-sm)' }}>
          <Stat label="Students helped" value={student.students_helped} />
          <Stat label="Skills" value={student.skills.length} />
          <Stat label="Teaching" value={student.can_teach ? 'Available' : 'Not right now'} />
        </div>

        {student.skills.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', marginBottom: 'var(--sp-2)' }}>
              Skills & Expertise
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              {student.skills.map((skill) => (
                <SkillBadge key={skill.id}>{skill.name}</SkillBadge>
              ))}
            </div>
          </div>
        )}

        {helpedConfirmation && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)',
            color: 'var(--success)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'center',
            marginBottom: 'var(--sp-3)',
          }}>
            ✓ Thanks! You confirmed {student.name.split(' ')[0]} helped you learn {helpedConfirmation.skill_name || 'a skill'}.
          </div>
        )}

        {sentConfirmation && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)',
            color: 'var(--success)', fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'center',
            marginBottom: 'var(--sp-3)',
          }}>
            Request sent — {student.name.split(' ')[0]} will get a notification.
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          {student.can_teach && student.skills.length > 0 ? (
            <button
              onClick={() => setShowRequestModal(true)}
              style={{
                flex: 1, minWidth: 160, padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--violet-600)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
              }}
            >
              Request Help
            </button>
          ) : (
            <button
              disabled
              style={{
                flex: 1, minWidth: 160, padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--ink-100)', color: 'var(--ink-500)',
                border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
                cursor: 'not-allowed',
              }}
            >
              Not accepting requests
            </button>
          )}

          {student.skills.length > 0 && (
            <button
              onClick={() => setShowHelpedModal(true)}
              style={{
                flex: 1, minWidth: 160, padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--amber-50)', color: 'var(--amber-800)',
                border: '1px solid var(--amber-400)', borderRadius: 'var(--radius-md)', fontWeight: 600,
              }}
            >
              ★ Mark as Helped
            </button>
          )}
        </div>
      </div>

      {showRequestModal && (
        <RequestHelpModal
          student={student}
          skills={student.skills}
          onClose={() => setShowRequestModal(false)}
          onSent={() => {
            setShowRequestModal(false)
            setSentConfirmation(true)
          }}
        />
      )}

      {showHelpedModal && (
        <MarkHelpedModal
          student={student}
          skills={student.skills}
          onClose={() => setShowHelpedModal(false)}
          onHelped={(res) => {
            setShowHelpedModal(false)
            setHelpedConfirmation(res)
            if (res.students_helped !== undefined) {
              setStudent((prev) => ({ ...prev, students_helped: res.students_helped }))
            }
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{value}</div>
      <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>{label}</div>
    </div>
  )
}
