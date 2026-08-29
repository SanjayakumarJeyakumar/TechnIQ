import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar } from '../services/profile'
import { fetchUserSkillIds, fetchAllSkills, setUserSkills } from '../services/skills'
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

    Promise.all([fetchUserSkillIds(user.id), fetchAllSkills()])
      .then(([userSkillIds, taxonomy]) => {
        setSelectedSkillIds(userSkillIds)
        setAllSkills(taxonomy)
        const mySkills = taxonomy.filter((s) => userSkillIds.includes(s.id))
        setSkills(mySkills)
      })
      .catch((err) => {
        console.error('Failed to load user skills:', err)
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 4, color: '#FFFFFF' }}>{profile.name}</h1>
                <p style={{ color: 'var(--ink-500)', margin: 0, fontSize: 'var(--text-sm)' }}>
                  {[profile.colleges?.name, profile.department, profile.year && `Year ${profile.year}`]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(!isEditing)
                  setMessage(null)
                  setError(null)
                }}
                className={isEditing ? 'btn-secondary' : 'btn-brand-primary'}
                style={{ padding: '6px 14px', height: 34, fontSize: 'var(--text-xs)' }}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
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
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FFFFFF',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            marginBottom: 'var(--sp-4)',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Statistics Bar */}
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
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="edit-bio">Bio & Learning Goals</label>
              <textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What topics are you passionate about? What skills are you looking to practice or share?"
                rows={3}
                className="input-dark"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ background: 'var(--surface-2)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-3)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canTeach}
                  onChange={(e) => setCanTeach(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
                />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: '#FFFFFF' }}>
                  I am available to teach/help other students in my college
                </span>
              </label>
            </div>

            {/* Skill Management UI */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-1)' }}>
                <label style={labelStyle}>Your Selected Skills ({selectedSkillIds.length})</label>
                <span style={{ fontSize: '11px', color: 'var(--ink-500)' }}>Click × to remove</span>
              </div>

              {selectedSkillIds.length === 0 ? (
                <div style={{
                  padding: 'var(--sp-3)',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--surface-3)',
                  color: 'var(--ink-500)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--sp-3)',
                }}>
                  No skills selected yet. Search and click skills below to add them.
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-3)',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--surface-3)',
                  marginBottom: 'var(--sp-3)',
                }}>
                  {selectedSkillIds.map((id) => {
                    const skill = allSkills.find((s) => s.id === id)
                    if (!skill) return null
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleRemoveSkill(id)}
                        title={`Click to remove ${skill.name}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--brand-primary)',
                          color: '#0F1115',
                          border: 'none',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all var(--dur-fast) var(--ease-out)',
                        }}
                      >
                        <span>{skill.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 900 }}>×</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Search & Add Skills */}
              <label style={{ ...labelStyle, marginTop: 'var(--sp-2)' }}>Add Skills to Your Profile</label>
              <div className="input-icon-wrapper" style={{ marginBottom: 'var(--sp-2)' }}>
                <svg className="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills to add (e.g. React, Python, UI Design, SQL)…"
                  className="input-dark"
                />
              </div>

              {/* Available skill chips to add */}
              <div style={{
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid var(--surface-3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-3)',
                background: 'var(--surface-2)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--sp-2)',
              }}>
                {availableFilteredSkills.length === 0 ? (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', padding: 'var(--sp-2)' }}>
                    {skillSearch.trim() ? `No additional skills match "${skillSearch}".` : 'All available skills are already added!'}
                  </span>
                ) : (
                  availableFilteredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleAddSkill(skill.id)}
                      title={`Click to add ${skill.name}`}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--surface-3)',
                        background: 'var(--surface-1)',
                        color: 'var(--ink-700)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--dur-fast) var(--ease-out)',
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

            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
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
                {saving ? 'Saving changes…' : 'Save Profile'}
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
