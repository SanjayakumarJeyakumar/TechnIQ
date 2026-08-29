import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { searchStudents } from '../services/search'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import StudentCard from '../components/StudentCard'
import EmptyState from '../components/EmptyState'

export default function Search() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [scope, setScope] = useState(searchParams.get('scope') || 'same_college') // same_college | any_college
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')

  const debouncedQuery = useDebouncedValue(query, 300)

  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  const runSearch = (currentQuery, currentScope) => {
    const trimmed = currentQuery.trim()
    if (!trimmed) {
      setResults([])
      setStatus('idle')
      return
    }

    setStatus('loading')
    searchStudents(trimmed, { scope: currentScope })
      .then((data) => {
        setResults(data)
        setStatus('done')
      })
      .catch((err) => {
        console.error('Search failed:', err)
        setStatus('error')
      })
  }

  useEffect(() => {
    const nextParams = {}
    if (debouncedQuery) nextParams.q = debouncedQuery
    if (scope !== 'same_college') nextParams.scope = scope
    setSearchParams(nextParams, { replace: true })

    runSearch(debouncedQuery, scope)
  }, [debouncedQuery, scope, setSearchParams])

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (department.trim() && !r.department?.toLowerCase().includes(department.trim().toLowerCase())) {
        return false
      }
      if (year && String(r.year) !== year) return false
      return true
    })
  }, [results, department, year])

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Find Students</h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-base)', margin: 0 }}>
          {scope === 'same_college'
            ? `Searching within ${profile?.colleges?.name || 'your college'} for students who can teach.`
            : 'Searching across all colleges on TechnIQ for students who can teach.'}
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="search-toolbar" style={{
        display: 'flex',
        gap: 'var(--sp-3)',
        flexWrap: 'wrap',
        background: 'var(--surface-1)',
        padding: 'var(--sp-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-3)',
        boxShadow: 'var(--shadow-sm)',
        alignItems: 'center',
      }}>
        {/* Search Input with Dedicated Non-Overlapping Icon */}
        <div className="input-icon-wrapper" style={{ flex: '2 1 280px', minWidth: 240 }}>
          <svg
            className="input-icon-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skill (e.g. React, Python, Artificial Intelligence, SQL)…"
            autoFocus
            className="input-dark"
          />
        </div>

        {/* Scope Selector: Same College vs Any College */}
        <div style={{ flex: '1 1 160px', minWidth: 150 }}>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="input-dark"
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              borderColor: scope === 'any_college' ? 'var(--brand-primary)' : 'var(--surface-3)',
              color: scope === 'any_college' ? 'var(--brand-primary)' : 'var(--ink-900)',
            }}
          >
            <option value="same_college">🏫 Same College</option>
            <option value="any_college">🌐 Any College</option>
          </select>
        </div>

        {/* Department Filter */}
        <div style={{ flex: '1 1 160px', minWidth: 140 }}>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department (optional)"
            className="input-dark"
          />
        </div>

        {/* Year Filter */}
        <div style={{ flex: '0 1 120px', minWidth: 110 }}>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input-dark"
            style={{ cursor: 'pointer' }}
          >
            <option value="">Any year</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* State Displays */}
      {status === 'idle' && (
        <EmptyState
          title="Search for a skill to discover student tutors"
          description={`Try typing "React", "Python", "Artificial Intelligence", or "Data Structures" to find peers willing to teach.`}
        />
      )}

      {status === 'loading' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--sp-4)',
        }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <EmptyState
          title="Search encountered an issue"
          description="We could not complete your search right now. Please try again."
          action={
            <button
              onClick={() => runSearch(debouncedQuery, scope)}
              className="btn-brand-primary"
              style={{ marginTop: 'var(--sp-3)' }}
            >
              Retry Search
            </button>
          }
        />
      )}

      {status === 'done' && filteredResults.length === 0 && (
        <EmptyState
          title={
            scope === 'same_college'
              ? `No students found in your college with "${debouncedQuery}"`
              : `No students found with "${debouncedQuery}" across any college`
          }
          description={
            scope === 'same_college'
              ? 'Try expanding your search to "🌐 Any College" above to discover students from other campuses.'
              : 'Try checking your spelling or searching for a related topic or skill.'
          }
          action={
            scope === 'same_college' ? (
              <button
                onClick={() => setScope('any_college')}
                className="btn-brand-primary"
                style={{ marginTop: 'var(--sp-3)' }}
              >
                Search in Any College →
              </button>
            ) : null
          }
        />
      )}

      {status === 'done' && filteredResults.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--sp-4)',
        }}>
          {filteredResults.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              showCollege={scope === 'any_college'}
            />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .search-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .search-toolbar > div {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
