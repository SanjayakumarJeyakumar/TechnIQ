import { useNavigate } from 'react-router-dom'
import SkillBadge from './SkillBadge'

export default function StudentCard({ student, showCollege = false }) {
  const navigate = useNavigate()
  const initial = (student.name || '?').trim().charAt(0).toUpperCase()
  const otherSkills = (student.all_skills || []).filter((s) => s !== student.matched_skill)

  return (
    <div
      onClick={() => navigate(`/students/${student.id}`)}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--sp-5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'var(--brand-primary)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderColor = 'var(--surface-3)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--brand-subtle)',
          border: '1.5px solid var(--surface-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {student.avatar_url ? (
            <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 'var(--text-base)' }}>
              {initial}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 2, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.name}
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[student.department, student.year && `Year ${student.year}`].filter(Boolean).join(' · ')}
          </p>
          {showCollege && student.college_name && (
            <p style={{ fontSize: '11px', color: 'var(--brand-primary)', margin: '2px 0 0 0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              🏛 {student.college_name}
            </p>
          )}
        </div>
      </div>

      {student.bio && (
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--ink-700)',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5,
        }}>
          {student.bio}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-1)', marginTop: 'auto' }}>
        {student.matched_skill && <SkillBadge emphasized>{student.matched_skill}</SkillBadge>}
        {otherSkills.slice(0, 3).map((name) => (
          <SkillBadge key={name}>{name}</SkillBadge>
        ))}
        {otherSkills.length > 3 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', padding: '2px 4px' }}>
            +{otherSkills.length - 3} more
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'var(--sp-1)',
        paddingTop: 'var(--sp-3)',
        borderTop: '1px solid var(--surface-3)',
      }}>
        <span style={{ fontSize: 'var(--text-xs)', color: student.students_helped > 0 ? 'var(--amber-800)' : 'var(--ink-500)', fontWeight: 500 }}>
          {student.students_helped > 0
            ? `★ ${student.students_helped} student${student.students_helped === 1 ? '' : 's'} helped`
            : 'New to teaching'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/students/${student.id}`)
          }}
          className="btn-brand-primary"
          style={{ padding: '6px 14px', height: 32, fontSize: 'var(--text-xs)' }}
        >
          View profile
        </button>
      </div>
    </div>
  )
}
