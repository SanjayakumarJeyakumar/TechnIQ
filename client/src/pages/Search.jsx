import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { searchStudents } from '../services/search'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import StudentCard from '../components/StudentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function Search() {
  const { profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')

  const debouncedQuery = useDebouncedValue(query, 350)

  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  useEffect(() => {
    // Keep the URL shareable/bookmarkable without spamming history entries.
    setSearchParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true })

    if (!debouncedQuery.trim()) {
      setResults([])
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('loading')

    searchStudents(debouncedQuery)
      .then((data) => {
        if (cancelled) return
        setResults(data)
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Search failed:', err)
        setStatus('error')
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

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
    <div>
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)' }}>Find students</h1>
        <p style={{ color: 'var(--ink-500)' }}>
          Showing students who can teach, from your college
          {profile?.department ? ` — same campus as you` : ''}.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to learn? e.g. React, Python, UI Design…"
          autoFocus
          style={{
            flex: '1 1 320px', padding: 'var(--sp-3) var(--sp-4)',
            border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-base)', background: 'var(--surface-1)', color: 'var(--ink-900)',
          }}
        />
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department (optional)"
          style={filterInputStyle}
        />
        <select value={year} onChange={(e) => setYear(e.target.value)} style={filterInputStyle}>
          <option value="">Any year</option>
          {[1, 2, 3, 4, 5].map((y) => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>
      </div>

      {status === 'idle' && (
        <EmptyState
          title="Search for a skill to get started"
          description={`Try "React", "Python", "Public Speaking" — anything from your skill list.`}
        />
      )}

      {status === 'loading' && <LoadingSpinner label="Finding students who can help…" />}

      {status === 'error' && (
        <EmptyState
          title="Something went wrong"
          description="We couldn't run that search. Please try again."
        />
      )}

      {status === 'done' && filteredResults.length === 0 && (
        <EmptyState
          title={`No students found for "${debouncedQuery}" in your college`}
          description="Try a different skill, or check back later as more students join."
        />
      )}

      {status === 'done' && filteredResults.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--sp-4)',
        }}>
          {filteredResults.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}

const filterInputStyle = {
  padding: 'var(--sp-3) var(--sp-4)', border: '1px solid var(--ink-100)',
  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
  background: 'var(--surface-1)', color: 'var(--ink-900)',
}
