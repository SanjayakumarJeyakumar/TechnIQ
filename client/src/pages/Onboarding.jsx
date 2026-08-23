import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchColleges } from '../services/colleges'
import { fetchAllSkills, setUserSkills } from '../services/skills'
import { updateProfile, uploadAvatar } from '../services/profile'
import ProgressBar from '../components/onboarding/ProgressBar'
import StepWelcome from '../components/onboarding/StepWelcome'
import StepBasicInfo from '../components/onboarding/StepBasicInfo'
import StepAvatar from '../components/onboarding/StepAvatar'
import StepSkills from '../components/onboarding/StepSkills'
import StepTeaching from '../components/onboarding/StepTeaching'
import StepBio from '../components/onboarding/StepBio'
import StepReview from '../components/onboarding/StepReview'
import LoadingSpinner from '../components/LoadingSpinner'

const STEPS = ['welcome', 'basics', 'avatar', 'skills', 'teaching', 'bio', 'review']

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [stepIndex, setStepIndex] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [colleges, setColleges] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [selectedSkillIds, setSelectedSkillIds] = useState(new Set())
  const [canTeach, setCanTeach] = useState(null)
  const [avatarError, setAvatarError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', collegeId: '', collegeAutoDetected: false,
    department: '', year: '', bio: '',
    avatarFile: null, avatarPreview: '',
  })

  // Load colleges + skill taxonomy, and pre-fill from the profile row that
  // handle_new_auth_user() already created (name/college may already be
  // guessed from the Google identity).
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [collegeRows, skillRows] = await Promise.all([fetchColleges(), fetchAllSkills()])
        if (!mounted) return
        setColleges(collegeRows)
        setAllSkills(skillRows)
        setForm((f) => ({
          ...f,
          name: profile?.name || user?.user_metadata?.full_name || '',
          collegeId: profile?.college_id || '',
          collegeAutoDetected: Boolean(profile?.college_id),
        }))
      } catch (err) {
        console.error('Failed to load onboarding data:', err)
      } finally {
        if (mounted) setLoadingData(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [profile, user])

  const collegeName = useMemo(
    () => colleges.find((c) => c.id === form.collegeId)?.name,
    [colleges, form.collegeId]
  )
  const selectedSkillNames = useMemo(
    () => allSkills.filter((s) => selectedSkillIds.has(s.id)).map((s) => s.name),
    [allSkills, selectedSkillIds]
  )

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  function canAdvance() {
    if (step === 'basics') {
      return form.name.trim() && form.collegeId && form.department.trim() && form.year
    }
    if (step === 'teaching') {
      return canTeach !== null
    }
    return true
  }

  async function handleFinish() {
    setSubmitError('')
    setSubmitting(true)
    try {
      let avatarUrl
      if (form.avatarFile) {
        try {
          avatarUrl = await uploadAvatar(user.id, form.avatarFile)
        } catch (err) {
          setAvatarError(err.message)
          setStepIndex(STEPS.indexOf('avatar'))
          setSubmitting(false)
          return
        }
      }

      await updateProfile(user.id, {
        name: form.name.trim(),
        college_id: form.collegeId,
        department: form.department.trim(),
        year: Number(form.year),
        bio: form.bio.trim() || null,
        can_teach: canTeach,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })

      await setUserSkills(user.id, Array.from(selectedSkillIds))
      await refreshProfile()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Onboarding submit failed:', err)
      setSubmitError('Something went wrong saving your profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div style={panelStyle}>
        <LoadingSpinner label="Setting things up…" />
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <ProgressBar current={stepIndex + 1} total={STEPS.length} />

      {step === 'welcome' && <StepWelcome name={form.name} />}
      {step === 'basics' && <StepBasicInfo form={form} setForm={setForm} colleges={colleges} />}
      {step === 'avatar' && <StepAvatar form={form} setForm={setForm} error={avatarError} />}
      {step === 'skills' && (
        <StepSkills allSkills={allSkills} selectedIds={selectedSkillIds} onChange={setSelectedSkillIds} />
      )}
      {step === 'teaching' && <StepTeaching canTeach={canTeach} setCanTeach={setCanTeach} />}
      {step === 'bio' && <StepBio bio={form.bio} setBio={(bio) => setForm((f) => ({ ...f, bio }))} />}
      {step === 'review' && (
        <StepReview
          form={form}
          collegeName={collegeName}
          selectedSkillNames={selectedSkillNames}
          canTeach={canTeach}
        />
      )}

      {submitError && (
        <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginTop: 'var(--sp-3)' }}>
          {submitError}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-6)' }}>
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0 || submitting}
          style={{
            padding: 'var(--sp-3) var(--sp-5)', background: 'none',
            border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
            color: 'var(--ink-700)', visibility: stepIndex === 0 ? 'hidden' : 'visible',
          }}
        >
          Back
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            disabled={!canAdvance()}
            style={primaryButtonStyle(!canAdvance())}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            style={primaryButtonStyle(submitting)}
          >
            {submitting ? 'Saving…' : 'Finish setup'}
          </button>
        )}
      </div>
    </div>
  )
}

const panelStyle = {
  background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
  borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)', boxShadow: 'var(--shadow-md)',
  minHeight: 320,
}

function primaryButtonStyle(disabled) {
  return {
    padding: 'var(--sp-3) var(--sp-5)',
    background: disabled ? 'var(--ink-100)' : 'var(--violet-600)',
    color: disabled ? 'var(--ink-500)' : '#fff',
    border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
