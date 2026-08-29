import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { deleteMyAccount, fetchBlockedStudents, unblockUser } from '../services/safety'
import Modal from '../components/Modal'

export default function Settings() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [inAppSound, setInAppSound] = useState(() => localStorage.getItem('techniq_sound') !== 'false')
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('techniq_email_alerts') === 'true')
  const [saved, setSaved] = useState(false)

  // Blocked students management state
  const [blockedStudents, setBlockedStudents] = useState([])
  const [blockedStatus, setBlockedStatus] = useState('loading') // loading | done | error
  const [selectedStudentToUnblock, setSelectedStudentToUnblock] = useState(null)
  const [unblocking, setUnblocking] = useState(false)
  const [unblockSuccess, setUnblockSuccess] = useState(null)

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const loadBlockedList = useCallback(async () => {
    setBlockedStatus('loading')
    try {
      const data = await fetchBlockedStudents()
      setBlockedStudents(data)
      setBlockedStatus('done')
    } catch (err) {
      console.error('Failed to load blocked students:', err)
      setBlockedStatus('error')
    }
  }, [])

  useEffect(() => {
    loadBlockedList()
  }, [loadBlockedList])

  const handleToggleSound = () => {
    const next = !inAppSound
    setInAppSound(next)
    localStorage.setItem('techniq_sound', String(next))
    triggerSaved()
  }

  const handleToggleEmail = () => {
    const next = !emailAlerts
    setEmailAlerts(next)
    localStorage.setItem('techniq_email_alerts', String(next))
    triggerSaved()
  }

  const triggerSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleConfirmUnblock = async () => {
    if (!selectedStudentToUnblock) return
    setUnblocking(true)
    try {
      await unblockUser(selectedStudentToUnblock.id)
      setBlockedStudents((prev) => prev.filter((s) => s.id !== selectedStudentToUnblock.id))
      setUnblockSuccess(`Unblocked ${selectedStudentToUnblock.name}.`)
      setSelectedStudentToUnblock(null)
      setTimeout(() => setUnblockSuccess(null), 3000)
    } catch (err) {
      console.error('Unblock failed:', err)
    } finally {
      setUnblocking(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmInput.trim().toUpperCase() !== 'DELETE') return
    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteMyAccount()
      setShowDeleteModal(false)
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Account deletion error:', err)
      setDeleteError(err.message || 'Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Settings & Account</h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-base)', margin: 0 }}>
          Manage your account preferences, privacy, safety, and campus affiliation.
        </p>
      </div>

      {saved && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#FFFFFF',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
        }}>
          ✓ Preferences saved successfully.
        </div>
      )}

      {unblockSuccess && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#FFFFFF',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
        }}>
          ✓ {unblockSuccess}
        </div>
      )}

      {/* Account Info Card */}
      <section style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: 'var(--text-md)', color: '#FFFFFF', marginBottom: 'var(--sp-4)' }}>
          Account & Campus Affiliation
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-4)' }}>
          <div>
            <span style={labelStyle}>Full Name</span>
            <p style={valueStyle}>{profile?.name || user?.user_metadata?.full_name || '—'}</p>
          </div>

          <div>
            <span style={labelStyle}>Verified Email</span>
            <p style={valueStyle}>{user?.email || '—'}</p>
          </div>

          <div>
            <span style={labelStyle}>College / Campus</span>
            <p style={valueStyle}>{profile?.colleges?.name || 'Assigned College'}</p>
          </div>

          <div>
            <span style={labelStyle}>Department</span>
            <p style={valueStyle}>{profile?.department || 'Not set'}</p>
          </div>
        </div>
      </section>

      {/* Privacy & Safety: Blocked Students */}
      <section style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <h2 style={{ fontSize: 'var(--text-md)', color: '#FFFFFF', margin: 0 }}>
            Privacy & Safety
          </h2>
          <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)', margin: 'var(--sp-1) 0 0 0' }}>
            Students you've blocked cannot appear in your search results or start new interactions with you.
          </p>
        </div>

        <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-3)' }}>
          Blocked Students ({blockedStatus === 'done' ? blockedStudents.length : '…'})
        </h3>

        {blockedStatus === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            <div className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)' }} />
          </div>
        )}

        {blockedStatus === 'error' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--surface-3)',
          }}>
            <span style={{ fontSize: 'var(--text-xs)', color: '#FCA5A5' }}>
              Unable to load blocked students.
            </span>
            <button
              onClick={loadBlockedList}
              className="btn-secondary"
              style={{ padding: '4px 10px', height: 28, fontSize: 'var(--text-xs)' }}
            >
              Retry
            </button>
          </div>
        )}

        {blockedStatus === 'done' && blockedStudents.length === 0 && (
          <div style={{
            padding: 'var(--sp-4)',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--surface-3)',
            textAlign: 'center',
            color: 'var(--ink-500)',
            fontSize: 'var(--text-sm)',
          }}>
            No blocked students. Students you block will appear here.
          </div>
        )}

        {blockedStatus === 'done' && blockedStudents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {blockedStudents.map((st) => (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--sp-3)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--surface-3)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'var(--surface-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {st.avatar_url ? (
                      <img src={st.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 700, color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>
                        {(st.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[st.college_name, st.department].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentToUnblock(st)}
                  className="btn-secondary"
                  style={{
                    padding: '6px 14px',
                    height: 34,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--brand-primary)',
                    borderColor: 'var(--surface-3)',
                    flexShrink: 0,
                  }}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notification Preferences */}
      <section style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: 'var(--text-md)', color: '#FFFFFF', marginBottom: 'var(--sp-4)' }}>
          In-App Preferences
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: 'var(--text-base)' }}>Audio Chime for Messages</span>
              <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)', margin: '2px 0 0 0' }}>
                Play a subtle chime when incoming peer messages arrive.
              </p>
            </div>
            <input
              type="checkbox"
              checked={inAppSound}
              onChange={handleToggleSound}
              style={{ width: 20, height: 20, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
            />
          </label>

          <div style={{ height: 1, background: 'var(--surface-3)' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: 'var(--text-base)' }}>Email Digests</span>
              <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)', margin: '2px 0 0 0' }}>
                Receive occasional campus digest updates and peer request summaries.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={handleToggleEmail}
              style={{ width: 20, height: 20, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
            />
          </label>
        </div>
      </section>

      {/* App & System Details */}
      <section style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: 'var(--text-md)', color: '#FFFFFF', marginBottom: 'var(--sp-4)' }}>
          About TechnIQ
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', fontSize: 'var(--text-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--ink-500)' }}>Theme</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Dark Theme (Default)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--ink-500)' }}>Platform Version</span>
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>TechnIQ v1.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--ink-500)' }}>AI Guide Engine</span>
            <span style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>Google Gemini 3.6 Flash</span>
          </div>
        </div>

        <div style={{ marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--surface-3)' }}>
          <button
            onClick={signOut}
            className="btn-secondary"
            style={{ color: '#FFFFFF', borderColor: 'var(--surface-3)' }}
          >
            Sign Out of TechnIQ
          </button>
        </div>
      </section>

      {/* Danger Zone: Account Deletion */}
      <section style={{
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
      }}>
        <h2 style={{ fontSize: 'var(--text-md)', color: '#EF4444', marginBottom: 'var(--sp-2)' }}>
          Danger Zone
        </h2>
        <p style={{ color: 'var(--ink-700)', fontSize: 'var(--text-sm)', margin: '0 0 var(--sp-4) 0', lineHeight: 1.5 }}>
          Permanently delete your profile, registered skills, notifications, and interaction history. This action cannot be undone.
        </p>

        <button
          type="button"
          onClick={() => {
            setConfirmInput('')
            setDeleteError(null)
            setShowDeleteModal(true)
          }}
          style={{
            padding: 'var(--sp-3) var(--sp-5)',
            background: 'transparent',
            border: '1px solid #EF4444',
            color: '#EF4444',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'all var(--dur-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EF4444'
            e.currentTarget.style.color = '#FFFFFF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#EF4444'
          }}
        >
          Delete Account…
        </button>
      </section>

      {/* Unblock Confirmation Modal */}
      {selectedStudentToUnblock && (
        <Modal
          isOpen={Boolean(selectedStudentToUnblock)}
          onClose={() => setSelectedStudentToUnblock(null)}
          title={`Unblock ${selectedStudentToUnblock.name}?`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ color: 'var(--ink-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
              Are you sure you want to unblock <strong>{selectedStudentToUnblock.name}</strong>?
            </p>
            <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)', margin: 0 }}>
              They will be able to discover your profile in skill searches, send you learning requests, and message you again.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
              <button
                type="button"
                onClick={() => setSelectedStudentToUnblock(null)}
                disabled={unblocking}
                className="btn-secondary"
                style={{ minWidth: 90 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnblock}
                disabled={unblocking}
                className="btn-brand-primary"
                style={{ minWidth: 120 }}
              >
                {unblocking ? 'Unblocking…' : 'Unblock Student'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deletion Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Permanently Delete Account?"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ color: 'var(--ink-700)', fontSize: 'var(--text-sm)', lineHeight: 1.6, margin: 0 }}>
              This will permanently delete your profile, skills, peer help statistics, and notification history from TechnIQ.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginBottom: 'var(--sp-1)' }}>
                Type <strong style={{ color: '#EF4444' }}>DELETE</strong> to confirm:
              </label>
              <input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE"
                className="input-dark"
                autoFocus
              />
            </div>

            {deleteError && (
              <div style={{
                padding: 'var(--sp-3)',
                background: 'var(--danger-bg)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
              }}>
                ✕ {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn-secondary"
                style={{ minWidth: 90 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || deleting}
                style={{
                  padding: 'var(--sp-3) var(--sp-5)',
                  background: confirmInput.trim().toUpperCase() === 'DELETE' ? '#EF4444' : 'var(--surface-3)',
                  color: confirmInput.trim().toUpperCase() === 'DELETE' ? '#FFFFFF' : 'var(--ink-500)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  cursor: confirmInput.trim().toUpperCase() === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                  minHeight: 44,
                }}
              >
                {deleting ? 'Deleting account…' : 'Delete Account Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  color: 'var(--ink-500)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 2,
}

const valueStyle = {
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: '#FFFFFF',
  margin: 0,
}
