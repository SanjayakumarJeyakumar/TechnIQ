import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchCollegeLeaderboard } from '../services/leaderboard'
import SkillBadge from '../components/SkillBadge'

export default function Home() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!profile?.college_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetchCollegeLeaderboard(profile.college_id)
      .then((data) => {
        if (cancelled) return
        setLeaderboard(data)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load leaderboard:', err)
        setError('Could not load the leaderboard at this time.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [profile?.college_id])

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* Hero Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #1A1D22 0%, #15181D 100%)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-7) var(--sp-6)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 193, 106, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--sp-2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--brand-subtle)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-primary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            marginBottom: 'var(--sp-3)',
          }}>
            <span>✨ Campus Peer Learning</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', marginBottom: 'var(--sp-2)', color: '#FFFFFF' }}>
            Learn together. Grow together.
          </h1>
          <p style={{ maxWidth: 520, color: 'var(--ink-700)', fontSize: 'var(--text-base)', lineHeight: 1.6, margin: '0 0 var(--sp-5) 0' }}>
            {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}. ` : ''}
            Connect with students from your college to master new skills or share your knowledge.
          </p>

          <form onSubmit={handleSubmit} className="hero-search-form" style={{ display: 'flex', gap: 'var(--sp-2)', maxWidth: 540, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What skill do you want to learn? (e.g. React, Python)"
                className="input-dark"
                style={{ borderRadius: 'var(--radius-pill)', height: 48 }}
              />
            </div>
            <button
              type="submit"
              className="btn-brand-primary"
              style={{ borderRadius: 'var(--radius-pill)', padding: '0 24px', height: 48, flexShrink: 0 }}
            >
              Find Helpers
            </button>
          </form>
        </div>
      </section>

      {/* College Leaderboard Section */}
      <section style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-3)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--sp-5)',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span style={{ fontSize: '1.35rem' }}>🏆</span>
              <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, color: '#FFFFFF' }}>
                {profile?.colleges?.name || 'Campus'} Leaderboard
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', margin: 'var(--sp-1) 0 0 0' }}>
              Recognizing the top peer helpers across your campus.
            </p>
          </div>

          <button
            onClick={() => navigate('/search')}
            style={{
              background: 'none', border: 'none', color: 'var(--brand-primary)',
              fontSize: 'var(--text-sm)', fontWeight: 600, padding: 0,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Explore all tutors →
          </button>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton" style={{ height: 68, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6)', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--sp-7) var(--sp-4)',
            background: 'var(--surface-2)',
            border: '1px dashed var(--surface-3)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--sp-2)' }}>🌱</span>
            <p style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>
              No peer help recorded yet!
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', maxWidth: 420, margin: '0 auto var(--sp-4)' }}>
              Be the first student to help a classmate or confirm learning assistance to earn recognition on the campus leaderboard.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn-brand-primary"
            >
              Find Students to Learn From
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {leaderboard.map((student, index) => {
              const isMe = student.id === user?.id
              const rank = index + 1
              const initial = (student.name || '?').trim().charAt(0).toUpperCase()

              return (
                <div
                  key={student.id}
                  onClick={() => navigate(isMe ? '/profile' : `/students/${student.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-3)',
                    padding: 'var(--sp-3) var(--sp-4)',
                    background: isMe ? 'rgba(0, 193, 106, 0.08)' : 'var(--surface-2)',
                    border: isMe ? '1px solid var(--brand-border)' : '1px solid var(--surface-3)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.borderColor = 'var(--brand-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderColor = isMe ? 'var(--brand-border)' : 'var(--surface-3)'
                  }}
                >
                  {/* Rank Indicator */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    background: rank === 1 ? 'rgba(245, 158, 11, 0.2)' : rank === 2 ? 'rgba(229, 231, 235, 0.15)' : rank === 3 ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
                    color: rank === 1 ? '#FBBF24' : rank === 2 ? '#E5E7EB' : rank === 3 ? '#F59E0B' : 'var(--ink-500)',
                    flexShrink: 0,
                  }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>

                  {/* Student Avatar */}
                  <div style={{
                    width: 42,
                    height: 42,
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
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 'var(--text-sm)' }}>
                        {initial}
                      </span>
                    )}
                  </div>

                  {/* Student Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {student.name}
                      </span>
                      {isMe && (
                        <span style={{
                          fontSize: '10px',
                          background: 'var(--brand-primary)',
                          color: '#0F1115',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-pill)',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[student.department, student.year && `Year ${student.year}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Skills preview on desktop/tablet */}
                  {student.skills.length > 0 && (
                    <div className="leaderboard-skills" style={{ display: 'none', gap: 'var(--sp-1)', flexWrap: 'wrap', maxWidth: 220 }}>
                      {student.skills.slice(0, 2).map((s) => (
                        <SkillBadge key={s.id}>{s.name}</SkillBadge>
                      ))}
                    </div>
                  )}

                  {/* Students Helped Counter Badge */}
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: student.students_helped > 0 ? 'var(--amber-50)' : 'var(--surface-3)',
                    border: student.students_helped > 0 ? '1px solid var(--amber-400)' : '1px solid var(--surface-3)',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 'var(--text-xs)',
                      color: student.students_helped > 0 ? 'var(--amber-800)' : 'var(--ink-500)',
                    }}>
                      ★ {student.students_helped} helped
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <style>{`
        @media (min-width: 640px) {
          .leaderboard-skills { display: flex !important; }
        }
        @media (max-width: 480px) {
          .hero-search-form button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
