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
  const [searchType, setSearchType] = useState(searchParams.get('type') === 'name' ? 'name' : 'skill') // 'skill' | 'name'
  const [scope, setScope] = useState(searchParams.get('scope') || 'same_college') // same_college | any_college
  const [department, setDepartment] = useState(searchParams.get('dept') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')

  const debouncedQuery = useDebouncedValue(query, 300)

  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  const runSearch = (currentQuery, currentScope, currentType) => {
    const trimmed = currentQuery.trim()
    if (!trimmed) {
      setResults([])
      setStatus('idle')
      return
    }

    setStatus('loading')
    searchStudents(trimmed, {
      scope: currentScope,
      type: currentType,
      collegeId: profile?.college_id,
    })
      .then((data) => {
        setResults(data)
        setStatus('done')
      })
      .catch((err) => {
        console.error('Search failed:', err)
        setStatus('error')
      })
  }

  // Update query params and run search when parameters change
  useEffect(() => {
    const nextParams = {}
    if (debouncedQuery) nextParams.q = debouncedQuery
    if (searchType !== 'skill') nextParams.type = searchType
    if (scope !== 'same_college') nextParams.scope = scope
    if (department.trim()) nextParams.dept = department.trim()
    if (year) nextParams.year = year
    setSearchParams(nextParams, { replace: true })

    runSearch(debouncedQuery, scope, searchType)
  }, [debouncedQuery, scope, searchType, department, year, setSearchParams])

  const handleTypeChange = (newType) => {
    if (newType === searchType) return
    setSearchType(newType)
  }

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
    <div className="search-page-flow">
      {/* 1. Header Section */}
      <div className="search-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', color: '#FFFFFF', margin: '0 0 4px 0' }}>Find Students</h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {scope === 'same_college'
            ? `Searching within ${profile?.colleges?.name || 'your college'}`
            : 'Searching across all colleges on TechnIQ'}
          {searchType === 'skill' ? ' for students by skill expertise.' : ' for students by name.'}
        </p>
      </div>

      {/* 2. Search Type Selector (~16px below header) */}
      <div className="search-type-selector">
        <button
          type="button"
          onClick={() => handleTypeChange('skill')}
          className={`search-type-btn ${searchType === 'skill' ? 'active' : ''}`}
        >
          <span>⚡</span>
          <span>Skill</span>
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('name')}
          className={`search-type-btn ${searchType === 'name' ? 'active' : ''}`}
        >
          <span>👤</span>
          <span>Student Name</span>
        </button>
      </div>

      {/* 3. Search Controls Stack (Exact 16px document flow on mobile, responsive on desktop) */}
      <div className="search-controls">
        {/* Search Input */}
        <div className="search-control-item input-icon-wrapper">
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
            placeholder={
              searchType === 'skill'
                ? 'Search skill (e.g. React, Python, AI)'
                : 'Search student name'
            }
            autoFocus
            className="input-dark search-field-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="search-clear-btn"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Same College Filter */}
        <div className="search-control-item">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="input-dark scope-select"
            style={{
              borderColor: scope === 'any_college' ? 'var(--brand-primary)' : 'var(--surface-3)',
              color: scope === 'any_college' ? 'var(--brand-primary)' : 'var(--ink-900)',
            }}
          >
            <option value="same_college">🏫 Same College</option>
            <option value="any_college">🌐 Any College</option>
          </select>
        </div>

        {/* Department Filter */}
        <div className="search-control-item">
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department (optional)"
            className="input-dark"
          />
        </div>

        {/* Year Filter */}
        <div className="search-control-item year-select-wrapper">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input-dark"
          >
            <option value="">Any year</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Results Section (~16px below controls) */}
      <div className="search-results-section">
        {status === 'idle' && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--sp-6) var(--sp-4)',
            background: 'var(--surface-1)',
            border: '1px dashed var(--surface-3)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--sp-2)' }}>
              {searchType === 'skill' ? '🔍' : '👥'}
            </span>
            <h3 style={{ fontSize: 'var(--text-lg)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>
              {searchType === 'skill'
                ? 'Search for a skill to discover student tutors'
                : 'Search for students by name'}
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-500)', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
              {searchType === 'skill'
                ? 'Try typing "React", "Python", "Artificial Intelligence", or "Data Structures" to find peers willing to teach.'
                : 'Enter a student name to find classmates across campus or other colleges.'}
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--sp-4)',
          }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="skeleton" style={{ height: 210, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <EmptyState
            title="Search encountered an issue"
            description="We could not complete your search right now. Please try again."
            action={
              <button
                onClick={() => runSearch(debouncedQuery, scope, searchType)}
                className="btn-brand-primary"
                style={{ marginTop: 'var(--sp-3)', height: 40, padding: '0 20px' }}
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
                ? `No students found in your college matching "${debouncedQuery}"`
                : `No students found matching "${debouncedQuery}" across any college`
            }
            description={
              scope === 'same_college'
                ? 'Try expanding your search to "🌐 Any College" to discover students from other campuses.'
                : searchType === 'skill'
                  ? 'Try checking your spelling or searching for a broader skill topic.'
                  : 'Try searching by first name or checking the spelling.'
            }
            action={
              scope === 'same_college' ? (
                <button
                  onClick={() => setScope('any_college')}
                  className="btn-brand-primary"
                  style={{ marginTop: 'var(--sp-3)', height: 40, padding: '0 20px' }}
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
      </div>

      <style>{`
        .search-page-flow {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
          width: 100%;
        }

        .search-header {
          min-height: 0;
          margin: 0;
          padding: 0;
        }

        .search-type-selector {
          display: inline-flex;
          background: var(--surface-1);
          padding: 3px;
          border-radius: var(--radius-md);
          border: 1px solid var(--surface-3);
          width: fit-content;
          max-width: 100%;
          min-height: 0;
          margin: 0;
        }

        .search-type-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid transparent;
          color: var(--ink-500);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--dur-fast) var(--ease-out);
          min-height: 0;
        }

        .search-type-btn.active {
          background: var(--brand-subtle);
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          font-weight: 600;
        }

        /* Search Controls: Strict Normal Vertical Document Flow with exact 16px gap */
        .search-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          margin: 0;
          padding: 0;
          min-height: 0;
        }

        .search-control-item {
          width: 100%;
          margin: 0;
          padding: 0;
          min-height: 0;
          flex: none;
        }

        .search-control-item input,
        .search-control-item select {
          width: 100%;
          height: 48px;
          box-sizing: border-box;
          margin: 0;
          font-size: var(--text-base);
        }

        .search-control-item select {
          cursor: pointer;
          font-weight: 500;
        }

        .scope-select {
          font-weight: 600 !important;
        }

        .search-clear-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--surface-3);
          color: var(--ink-500);
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 11px;
          z-index: 2;
        }

        .search-results-section {
          width: 100%;
          margin: 0;
          padding: 0;
          min-height: 0;
        }

        .search-field-input:focus, .input-dark:focus {
          scroll-margin-top: 80px;
        }

        /* Desktop layout (>= 768px): clean horizontal alignment for the filters */
        @media (min-width: 768px) {
          .search-controls {
            display: grid;
            grid-template-columns: 2fr 1.2fr 1.2fr 0.9fr;
            gap: 12px;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}
