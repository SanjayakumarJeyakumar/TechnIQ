import { useNavigate } from 'react-router-dom'
import SkillBadge from './SkillBadge'

export default function StudentCard({ student }) {
  const navigate = useNavigate()
  const initial = (student.name || '?').trim().charAt(0).toUpperCase()
  const otherSkills = (student.all_skills || []).filter((s) => s !== student.matched_skill)

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)',
      display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
    }}>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden',
        }}>
          {student.avatar_url ? (
            <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontWeight: 600, color: 'var(--violet-800)' }}>{initial}</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 2 }}>{student.name}</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', margin: 0 }}>
            {[student.department, student.year && `Year ${student.year}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {student.bio && (
        <p style={{
          fontSize: 'var(--text-sm)', color: 'var(--ink-700)', margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {student.bio}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
        <SkillBadge emphasized>{student.matched_skill}</SkillBadge>
        {otherSkills.slice(0, 3).map((name) => (
          <SkillBadge key={name}>{name}</SkillBadge>
        ))}
        {otherSkills.length > 3 && <SkillBadge>+{otherSkills.length - 3} more</SkillBadge>}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 'var(--sp-1)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--ink-100)',
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)' }}>
          {student.students_helped > 0
            ? `Helped ${student.students_helped} student${student.students_helped === 1 ? '' : 's'}`
            : 'New to teaching'}
        </span>
        <button
          onClick={() => navigate(`/students/${student.id}`)}
          style={{
            padding: 'var(--sp-2) var(--sp-4)', background: 'var(--violet-600)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)', fontWeight: 500,
          }}
        >
          View profile
        </button>
      </div>
    </div>
  )
}
