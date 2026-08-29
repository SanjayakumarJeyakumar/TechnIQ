import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchCollegeLeaderboard } from '../services/leaderboard'
import SkillBadge from '../components/SkillBadge'
import LoadingSpinner from '../components/LoadingSpinner'

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
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Hero Banner */}
      <section style={{
        background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--sp-7) var(--sp-6)',
        marginBottom: 'var(--sp-6)', boxShadow: 'var(--shadow-sm)',
      }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--sp-2)' }}>
          Learn together. Grow together.
        </h1>
        <p style={{ maxWidth: 520, color: 'var(--ink-700)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
          {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}. ` : ''}
          Find students from your college who can help you learn skills or share what you know.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 'var(--sp-5)', display: 'flex', gap: 'var(--sp-2)', maxWidth: 500 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills (e.g. React, Python, UI Design)…"
            style={{
              flex: 1, padding: 'var(--sp-3) var(--sp-4)',
              border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--text-base)', background: 'var(--surface-0)', color: 'var(--ink-900)',
            }}
          />
          <button
            type="submit"
            style={{
              padding: 'var(--sp-3) var(--sp-5)', background: 'var(--violet-600)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)',
              fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}
          >
            Find Helpers
          </button>
        </form>
      </section>

      {/* College Leaderboard Section */}
      <section style={{
        background: 'var(--surface-1)', border: '1px solid var(--ink-100)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--sp-6)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span style={{ fontSize: '1.25rem' }}>🏆</span>
              <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>
                {profile?.colleges?.name || 'Campus'} Leaderboard
              </h2>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', margin: 'var(--sp-1) 0 0 0' }}>
              Recognizing top peer helpers at your college.
            </p>
          </div>

          <button
            onClick={() => navigate('/search')}
            style={{
              background: 'none', border: 'none', color: 'var(--violet-600)',
              fontSize: 'var(--text-sm)', fontWeight: 600, padding: 'var(--sp-1) 0',
              cursor: 'pointer',
            }}
          >
            Explore all tutors →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--sp-6) 0' }}>
            <LoadingSpinner label="Loading campus leaderboard…" />
          </div>
        ) : error ? (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--sp-4)' }}>
            {error}
          </p>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)', background: 'var(--surface-0)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontWeight: 600, color: 'var(--ink-900)', marginBottom: 'var(--sp-1)' }}>
              No peer help recorded yet!
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', maxWidth: 400, margin: '0 auto var(--sp-4)' }}>
              Be the first student to help a classmate or request learning assistance to earn points.
            </p>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: 'var(--sp-2) var(--sp-4)', background: 'var(--violet-600)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
              }}
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
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                    padding: 'var(--sp-3) var(--sp-4)',
                    background: isMe ? 'var(--violet-50)' : 'var(--surface-0)',
                    border: isMe ? '1px solid var(--violet-400)' : '1px solid var(--ink-100)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 'var(--text-sm)',
                    background: rank === 1 ? '#FEF3C7' : rank === 2 ? '#F3F4F6' : rank === 3 ? '#FFEDD5' : 'transparent',
                    color: rank === 1 ? '#B45309' : rank === 2 ? '#4B5563' : rank === 3 ? '#C2410C' : 'var(--ink-500)',
                    border: rank <= 3 ? '1px solid currentColor' : 'none',
                    flexShrink: 0,
                  }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>

                  {/* Student Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', overflow: 'hidden',
                  }}>
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontWeight: 600, color: 'var(--violet-800)', fontSize: 'var(--text-sm)' }}>
                        {initial}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--ink-900)' }}>
                        {student.name}
                      </span>
                      {isMe && (
                        <span style={{
                          fontSize: 'var(--text-xs)', background: 'var(--violet-600)', color: '#fff',
                          padding: '1px 6px', borderRadius: 'var(--radius-pill)', fontWeight: 600,
                        }}>
                          You
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', margin: '2px 0 0 0' }}>
                      {[student.department, student.year && `Year ${student.year}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Skills preview on desktop */}
                  {student.skills.length > 0 && (
                    <div style={{ display: 'none', gap: 'var(--sp-1)', flexWrap: 'wrap', maxWidth: 220 }} className="desktop-skills">
                      {student.skills.slice(0, 2).map((s) => (
                        <SkillBadge key={s.id}>{s.name}</SkillBadge>
                      ))}
                    </div>
                  )}

                  {/* Helped count */}
                  <div style={{
                    textAlign: 'right', flexShrink: 0, padding: 'var(--sp-1) var(--sp-3)',
                    background: student.students_helped > 0 ? 'var(--amber-50)' : 'var(--surface-2)',
                    borderRadius: 'var(--radius-pill)', border: student.students_helped > 0 ? '1px solid var(--amber-400)' : '1px solid var(--ink-100)',
                  }}>
                    <span style={{
                      fontWeight: 700, fontSize: 'var(--text-sm)',
                      color: student.students_helped > 0 ? 'var(--amber-800)' : 'var(--ink-500)',
                    }}>
                      {student.students_helped} {student.students_helped === 1 ? 'helped' : 'helped'}
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
          .desktop-skills { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
