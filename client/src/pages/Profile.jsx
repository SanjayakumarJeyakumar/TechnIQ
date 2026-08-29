import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar } from '../services/profile'
import { fetchUserSkillIds, fetchAllSkills, setUserSkills } from '../services/skills'
import SkillBadge from '../components/SkillBadge'
import LoadingSpinner from '../components/LoadingSpinner'

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
    if (!user?.id) return

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
      setMessage('Profile updated successfully.')
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSkill = (skillId) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    )
  }

  if (!profile) {
    return (
      <div style={{ padding: 'var(--sp-6) 0' }}>
        <LoadingSpinner label="Loading your profile…" />
      </div>
    )
  }

  const initial = (profile.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)', boxShadow: 'var(--shadow-md)',
      }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
              background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 30, fontWeight: 600, color: 'var(--violet-800)' }}>{initial}</span>
              )}
            </div>

            <label style={{
              position: 'absolute', bottom: -4, right: -4, background: 'var(--violet-600)',
              color: '#fff', width: 26, height: 26, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploading ? 'wait' : 'pointer', fontSize: 13, boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} title="Change photo">
              ✎
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 2 }}>{profile.name}</h1>
                <p style={{ color: 'var(--ink-500)', margin: 0, fontSize: 'var(--text-sm)' }}>
                  {[profile.colleges?.name, profile.department, profile.year && `Year ${profile.year}`]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsEditing(!isEditing)
                  setMessage(null)
                  setError(null)
                }}
                style={{
                  padding: 'var(--sp-2) var(--sp-3)', background: isEditing ? 'var(--surface-2)' : 'var(--violet-50)',
                  color: isEditing ? 'var(--ink-700)' : 'var(--violet-800)', border: 'none',
                  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)',
            color: 'var(--success)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--sp-4)',
          }}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)',
            color: 'var(--danger)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--sp-4)',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Stats Row */}
        <div style={{
          display: 'flex', gap: 'var(--sp-5)', padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--surface-0)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--sp-5)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--amber-800)' }}>
              {profile.students_helped}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Students helped</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--ink-900)' }}>
              {skills.length}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Skills listed</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: profile.can_teach ? 'var(--success)' : 'var(--ink-500)' }}>
              {profile.can_teach ? 'Available' : 'Paused'}
            </div>
            <div style={{ color: 'var(--ink-500)', fontSize: 'var(--text-xs)' }}>Teaching status</div>
          </div>
        </div>

        {/* Bio and Edit Form */}
        {!isEditing ? (
          <div>
            {profile.bio && (
              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', marginBottom: 'var(--sp-1)' }}>About Me</h3>
                <p style={{ color: 'var(--ink-900)', lineHeight: 1.6, margin: 0 }}>{profile.bio}</p>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', marginBottom: 'var(--sp-2)' }}>My Skills</h3>
              {skills.length === 0 ? (
                <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)' }}>No skills selected yet. Click Edit Profile to add skills.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {skills.map((skill) => (
                    <SkillBadge key={skill.id}>{skill.name}</SkillBadge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <label style={labelStyle} htmlFor="edit-name">Display Name</label>
              <input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <div style={{ flex: 2 }}>
                <label style={labelStyle} htmlFor="edit-dept">Department / Major</label>
                <input
                  id="edit-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  style={inputStyle}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={labelStyle} htmlFor="edit-year">Year</label>
                <select
                  id="edit-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={inputStyle}
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
              <label style={labelStyle} htmlFor="edit-bio">Bio & Experience</label>
              <textarea
                id="edit-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What are you currently studying or building? What topics are you excited to share?"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={canTeach}
                  onChange={(e) => setCanTeach(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink-900)' }}>
                  I am available to help other students (show me in search results)
                </span>
              </label>
            </div>

            {/* Skill Selector */}
            <div>
              <label style={labelStyle}>Select Skills You Know</label>
              <div style={{
                maxHeight: 180, overflowY: 'auto', border: '1px solid var(--ink-100)',
                borderRadius: 'var(--radius-md)', padding: 'var(--sp-3)', background: 'var(--surface-0)',
                display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)',
              }}>
                {allSkills.map((skill) => {
                  const isSelected = selectedSkillIds.includes(skill.id)
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      style={{
                        padding: 'var(--sp-1) var(--sp-3)',
                        borderRadius: 'var(--radius-pill)',
                        border: isSelected ? '1px solid var(--violet-600)' : '1px solid var(--ink-100)',
                        background: isSelected ? 'var(--violet-600)' : 'var(--surface-1)',
                        color: isSelected ? '#fff' : 'var(--ink-900)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {skill.name} {isSelected ? '✓' : '+'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
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
                disabled={saving}
                style={{
                  flex: 2, padding: 'var(--sp-3) var(--sp-4)',
                  background: saving ? 'var(--ink-100)' : 'var(--violet-600)',
                  color: saving ? 'var(--ink-500)' : '#fff',
                  border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
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

const inputStyle = {
  width: '100%', padding: 'var(--sp-3) var(--sp-4)',
  border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', background: 'var(--surface-0)', color: 'var(--ink-900)',
}

const labelStyle = {
  display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
  color: 'var(--ink-700)', marginBottom: 'var(--sp-1)',
}
