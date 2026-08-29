import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchStudentProfile } from '../services/students'
import { blockUser, unblockUser, checkBlockStatus, reportUser } from '../services/safety'
import SkillBadge from '../components/SkillBadge'
import EmptyState from '../components/EmptyState'
import RequestHelpModal from '../components/RequestHelpModal'
import MarkHelpedModal from '../components/MarkHelpedModal'
import BlockModal from '../components/BlockModal'
import ReportModal from '../components/ReportModal'

export default function StudentProfile() {
  const params = useParams()
  const targetId = params.studentId || params.userId
  const { user } = useAuth()
  const navigate = useNavigate()

  const [student, setStudent] = useState(null)
  const [status, setStatus] = useState('loading') // loading | done | error
  const [isBlocked, setIsBlocked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showHelpedModal, setShowHelpedModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const [sentConfirmation, setSentConfirmation] = useState(null)
  const [helpedConfirmation, setHelpedConfirmation] = useState(null)
  const [safetyMessage, setSafetyMessage] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    if (!targetId) return

    Promise.all([fetchStudentProfile(targetId), checkBlockStatus(targetId)])
      .then(([profileData, blocked]) => {
        if (cancelled) return
        setStudent(profileData)
        setIsBlocked(blocked)
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load student profile:', err)
        setStatus('error')
      })

    return () => { cancelled = true }
  }, [targetId])

  // Viewing your own card via a direct link — send to real profile page
  if (user?.id === targetId) {
    return <Navigate to="/profile" replace />
  }

  if (status === 'loading') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="skeleton" style={{ height: 38, width: 90, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-xl)' }} />
      </div>
    )
  }

  if (status === 'error' || !student) {
    return (
      <EmptyState
        title="Couldn't load this student profile"
        description="This profile may no longer exist, or you may need to sign in again."
      />
    )
  }

  const initial = (student.name || '?').trim().charAt(0).toUpperCase()

  const handleConfirmBlock = async () => {
    await blockUser(student.id)
    setIsBlocked(true)
    setShowMenu(false)
    setSafetyMessage(`You have blocked ${student.name}. They will not appear in your search results.`)
  }

  const handleUnblock = async () => {
    try {
      await unblockUser(student.id)
      setIsBlocked(false)
      setSafetyMessage(`You have unblocked ${student.name}.`)
    } catch (err) {
      console.error('Unblock failed:', err)
    }
  }

  const handleConfirmReport = async ({ reason, description }) => {
    await reportUser(student.id, { reason, description })
    setShowMenu(false)
    setSafetyMessage(`Report received. Thank you for helping keep the TechnIQ community safe.`)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--surface-3)',
            color: 'var(--ink-500)',
            fontSize: 'var(--text-sm)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Back
        </button>

        {/* Safety Actions Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Student options"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--surface-3)',
              color: 'var(--ink-700)',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            ⋯
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 42,
              background: 'var(--surface-1)',
              border: '1px solid var(--surface-3)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 30,
              minWidth: 160,
              overflow: 'hidden',
            }}>
              {!isBlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    setShowBlockModal(true)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🚫</span> Block Student
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false)
                    handleUnblock()
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-subtle)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🔓</span> Unblock Student
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false)
                  setShowReportModal(true)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid var(--surface-3)',
                  color: 'var(--ink-700)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <span>🚩</span> Report Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {safetyMessage && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--surface-2)',
          border: '1px solid var(--brand-primary)',
          borderRadius: 'var(--radius-md)',
          color: '#FFFFFF',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          marginBottom: 'var(--sp-4)',
        }}>
          ℹ {safetyMessage}
        </div>
      )}

      {isBlocked && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--sp-4)',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', color: '#FCA5A5', fontWeight: 500 }}>
            🚫 You have blocked this student.
          </span>
          <button
            onClick={handleUnblock}
            className="btn-secondary"
            style={{ padding: '4px 12px', height: 30, fontSize: 'var(--text-xs)' }}
          >
            Unblock
          </button>
        </div>
      )}

      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Profile Top Info */}
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'var(--brand-subtle)',
            border: '2px solid var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {student.avatar_url ? (
              <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--brand-primary)' }}>{initial}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 4, color: '#FFFFFF' }}>{student.name}</h1>
            <p style={{ color: 'var(--ink-500)', margin: 0, fontSize: 'var(--text-sm)' }}>
              {[student.collegeName, student.department, student.year && `Year ${student.year}`]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {student.bio && (
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <p style={{ color: 'var(--ink-700)', lineHeight: 1.6, margin: 0, fontSize: 'var(--text-base)' }}>
              {student.bio}
            </p>
          </div>
        )}

        {/* Statistics Banner */}
        <div style={{
          display: 'flex',
          gap: 'var(--sp-4)',
          margin: 'var(--sp-4) 0 var(--sp-5)',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--surface-2)',
          border: '1px solid var(--surface-3)',
          borderRadius: 'var(--radius-lg)',
          flexWrap: 'wrap',
        }}>
          <Stat label="Students helped" value={`★ ${student.students_helped}`} color="var(--amber-800)" />
          <Stat label="Skills listed" value={student.skills.length} color="#FFFFFF" />
          <Stat
            label="Teaching status"
            value={student.can_teach ? 'Available' : 'Paused'}
            color={student.can_teach ? 'var(--brand-primary)' : 'var(--ink-500)'}
          />
        </div>

        {/* Skills Section */}
        {student.skills.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-2)' }}>
              Skills & Expertise
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              {student.skills.map((skill) => (
                <SkillBadge key={skill.id} emphasized>{skill.name}</SkillBadge>
              ))}
            </div>
          </div>
        )}

        {/* Confirmation Banners */}
        {helpedConfirmation && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FFFFFF',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: 'var(--sp-4)',
          }}>
            ✓ Thanks! You confirmed {student.name.split(' ')[0]} helped you learn {helpedConfirmation.skill_name || 'a skill'}.
          </div>
        )}

        {sentConfirmation && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FFFFFF',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: 'var(--sp-4)',
          }}>
            ✓ Request sent — {student.name.split(' ')[0]} will get a notification.
          </div>
        )}

        {/* Action Buttons */}
        {!isBlocked && (
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            {student.can_teach && student.skills.length > 0 ? (
              <button
                onClick={() => setShowRequestModal(true)}
                className="btn-brand-primary"
                style={{ flex: '1 1 180px' }}
              >
                Request Learning Help
              </button>
            ) : (
              <button
                disabled
                className="btn-secondary"
                style={{ flex: '1 1 180px', opacity: 0.6, cursor: 'not-allowed' }}
              >
                Not currently accepting requests
              </button>
            )}

            {student.skills.length > 0 && (
              <button
                onClick={() => setShowHelpedModal(true)}
                style={{
                  flex: '1 1 180px',
                  padding: 'var(--sp-3) var(--sp-5)',
                  background: 'var(--amber-50)',
                  color: 'var(--amber-800)',
                  border: '1px solid var(--amber-400)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                  minHeight: 44,
                }}
              >
                ★ Mark as Helped
              </button>
            )}
          </div>
        )}
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

      {showBlockModal && (
        <BlockModal
          isOpen={showBlockModal}
          studentName={student.name}
          onClose={() => setShowBlockModal(false)}
          onConfirmBlock={handleConfirmBlock}
        />
      )}

      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          studentName={student.name}
          onClose={() => setShowReportModal(false)}
          onConfirmReport={handleConfirmReport}
        />
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 100 }}>
      <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: color || '#FFFFFF' }}>{value}</div>
      <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>{label}</div>
    </div>
  )
}
