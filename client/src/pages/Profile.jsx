import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar } from '../services/profile'
import { fetchUserSkillIds, fetchAllSkills, setUserSkills } from '../services/skills'
import { fetchStudentEndorsements } from '../services/students'
import { ENDORSEMENT_MAP } from '../constants/endorsements'
import SkillBadge from '../components/SkillBadge'

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [bio, setBio] = useState('')
  const [canTeach, setCanTeach] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')

  const [skills, setSkills] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [selectedSkillIds, setSelectedSkillIds] = useState([])
  const [skillSearch, setSkillSearch] = useState('')
  const [endorsements, setEndorsements] = useState([])

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setDepartment(profile.department || '')
      setYear(profile.year ? String(profile.year) : '')
      setBio(profile.bio || '')
      setCanTeach(Boolean(profile.can_teach))
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  useEffect(() => {
    if (!user?.id) return

    Promise.all([
      fetchUserSkillIds(user.id),
      fetchAllSkills(),
      fetchStudentEndorsements(user.id),
    ])
      .then(([userSkillIds, taxonomy, endorsementData]) => {
        setSelectedSkillIds(userSkillIds)
        setAllSkills(taxonomy)
        const mySkills = taxonomy.filter((s) => userSkillIds.includes(s.id))
        setSkills(mySkills)
        setEndorsements(endorsementData)
      })
      .catch((err) => {
        console.error('Failed to load user profile data:', err)
      })
  }, [user?.id])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setUploading(true)
    setError(null)
    try {
      const publicUrl = await uploadAvatar(user.id, file)
      setAvatarUrl(publicUrl)
      await updateProfile(user.id, { avatar_url: publicUrl })
      await refreshProfile()
      setMessage('Avatar updated successfully.')
    } catch (err) {
      console.error('Avatar upload failed:', err)
      setError(err.message || 'Failed to upload avatar.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user?.id || saving) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await updateProfile(user.id, {
        name: name.trim(),
        department: department.trim(),
        year: year ? parseInt(year, 10) : null,
        bio: bio.trim(),
        can_teach: canTeach,
      })

      if (isEditing) {
        await setUserSkills(user.id, selectedSkillIds)
        const updatedSkills = allSkills.filter((s) => selectedSkillIds.includes(s.id))
        setSkills(updatedSkills)
      }

      await refreshProfile()
      setIsEditing(false)
      setMessage('Profile saved successfully.')
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = (skillId) => {
    if (!selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds((prev) => [...prev, skillId])
    }
  }

  const handleRemoveSkill = (skillId) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillId))
  }

  const availableFilteredSkills = useMemo(() => {
    const search = skillSearch.trim().toLowerCase()
    return allSkills.filter((s) => {
      if (selectedSkillIds.includes(s.id)) return false
      if (!search) return true
      return s.name.toLowerCase().includes(search) || s.category?.toLowerCase().includes(search)
    })
  }, [allSkills, selectedSkillIds, skillSearch])

  if (!profile) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />
      </div>
    )
  }

  const initial = (profile.name || '?').trim().charAt(0).toUpperCase()
  const activeEndorsements = endorsements.filter((e) => Number(e.count) > 0)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Profile Header Card */}
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'var(--brand-subtle)',
              border: '2px solid var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-primary)' }}>{initial}</span>
              )}
            </div>

            <label style={{
              position: 'absolute', bottom: -2, right: -2,
              background: 'var(--brand-primary)', color: '#0F1115',
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }} title="Change avatar photo">
              ✎
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
              <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, color: '#FFFFFF' }}>{profile.name}</h1>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}
                >
                  ✎ Edit Profile
                </button>
              )}
            </div>
            <p style={{ color: 'var(--ink-500)', margin: '4px 0 0 0', fontSize: 'var(--text-sm)' }}>
              {[profile.colleges?.name, profile.department, profile.year && `Year ${profile.year}`]
                .filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {message && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FFFFFF',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            marginBottom: 'var(--sp-4)',
          }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--danger-bg)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            marginBottom: 'var(--sp-4)',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Statistics & Reputation Banner */}
        <div style={{
          display: 'flex',
          gap: 'var(--sp-4)',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--surface-2)',
          border: '1px solid var(--surface-3)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--sp-5)',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--amber-800)' }}>
              ★ {profile.students_helped}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Students helped</div>
          </div>
          {activeEndorsements.length > 0 && (
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--brand-primary)' }}>
                🏆 {activeEndorsements.length}
              </div>
              <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Peer strengths</div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: '#FFFFFF' }}>
              {skills.length}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Skills registered</div>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: profile.can_teach ? 'var(--brand-primary)' : 'var(--ink-500)' }}>
              {profile.can_teach ? 'Available to teach' : 'Paused'}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Teaching status</div>
          </div>
        </div>

        {/* Peer Feedback Section (View Mode) */}
        {!isEditing && activeEndorsements.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-2)' }}>
              Peer Feedback ({activeEndorsements.reduce((acc, curr) => acc + Number(curr.count), 0)})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
              {activeEndorsements.map((e) => {
                const meta = ENDORSEMENT_MAP[e.tag]
                if (!meta) return null
                return (
                  <div
                    key={e.tag}
                    title={meta.description}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--surface-3)',
                      color: '#FFFFFF',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--brand-subtle)',
                      color: 'var(--brand-primary)',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}>
                      {e.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* View Mode */}
        {!isEditing ? (
          <div>
            {profile.bio && (
              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-2)' }}>
                  About Me
                </h3>
                <p style={{ color: 'var(--ink-700)', lineHeight: 1.6, margin: 0, fontSize: 'var(--text-base)' }}>
                  {profile.bio}
                </p>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--sp-2)' }}>
                Your Skills ({skills.length})
              </h3>
              {skills.length === 0 ? (
                <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>No skills selected yet. Click Edit Profile to add skills.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {skills.map((skill) => (
                    <SkillBadge key={skill.id} emphasized>{skill.name}</SkillBadge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <label style={labelStyle} htmlFor="edit-name">Display Name</label>
              <input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-dark"
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 200px' }}>
                <label style={labelStyle} htmlFor="edit-dept">Department / Major</label>
                <input
                  id="edit-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="input-dark"
                />
              </div>

              <div style={{ flex: '1 1 120px' }}>
                <label style={labelStyle} htmlFor="edit-year">Year</label>
                <select
                  id="edit-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-dark"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year / Postgrad</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="edit-bio">Bio / Study Goals</label>
              <textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share what you're studying, subjects you enjoy helping with, or your background..."
                className="input-dark"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canTeach}
                  onChange={(e) => setCanTeach(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: '#FFFFFF', fontWeight: 500 }}>
                  Available to help other students (Tutor Profile active)
                </span>
              </label>
            </div>

            {/* Manage Skills UI in Edit Mode */}
            <div style={{
              padding: 'var(--sp-4)',
              background: 'var(--surface-2)',
              border: '1px solid var(--surface-3)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 'var(--sp-2)',
            }}>
              <div style={{ marginBottom: 'var(--sp-3)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', color: '#FFFFFF', margin: 0 }}>
                  Manage Your Skills ({selectedSkillIds.length})
                </h3>
                <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)', margin: '2px 0 0 0' }}>
                  Click [ × ] to remove a skill. Search below to add new skills to your profile.
                </p>
              </div>

              {/* Active Selected Skills Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', minHeight: 34 }}>
                {selectedSkillIds.length === 0 ? (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', fontStyle: 'italic' }}>
                    No skills selected. Search and add skills below.
                  </span>
                ) : (
                  selectedSkillIds.map((id) => {
                    const skill = allSkills.find((s) => s.id === id)
                    if (!skill) return null
                    return (
                      <span
                        key={id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--brand-subtle)',
                          border: '1px solid var(--brand-primary)',
                          color: 'var(--brand-primary)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                        }}
                      >
                        {skill.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(id)}
                          aria-label={`Remove ${skill.name}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand-primary)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '13px',
                            lineHeight: 1,
                            fontWeight: 'bold',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })
                )}
              </div>

              {/* Search to Add Taxonomy Skills */}
              <div>
                <label style={{ ...labelStyle, marginBottom: 4 }}>Add Skills from Campus Taxonomy</label>
                <input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search available skills (e.g. Python, React, Data Structures)..."
                  className="input-dark"
                  style={{ marginBottom: 'var(--sp-2)' }}
                />

                <div style={{
                  maxHeight: 140,
                  overflowY: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-2)',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--surface-3)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  {availableFilteredSkills.length === 0 ? (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', padding: '4px 8px' }}>
                      {skillSearch ? 'No matching unselected skills found.' : 'All available skills are already selected.'}
                    </span>
                  ) : (
                    availableFilteredSkills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleAddSkill(skill.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--surface-3)',
                          color: 'var(--ink-700)',
                          fontSize: 'var(--text-xs)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--brand-primary)'
                          e.currentTarget.style.color = '#FFFFFF'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--surface-3)'
                          e.currentTarget.style.color = 'var(--ink-700)'
                        }}
                      >
                        + {skill.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-brand-primary"
                style={{ flex: 2 }}
              >
                {saving ? 'Saving Changes…' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
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
