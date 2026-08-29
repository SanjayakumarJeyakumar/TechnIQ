export default function StepBasicInfo({ form, setForm, colleges }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>The Basics</h2>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>Tell us about your campus and degree.</p>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label style={labelStyle} htmlFor="ob-name">Full Name</label>
        <input
          id="ob-name"
          className="input-dark"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name"
        />
      </div>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label style={labelStyle} htmlFor="ob-college">College / Campus</label>
        <select
          id="ob-college"
          className="input-dark"
          value={form.collegeId || ''}
          onChange={(e) => setForm((f) => ({ ...f, collegeId: e.target.value }))}
          style={{ cursor: 'pointer' }}
        >
          <option value="" disabled>
            {form.collegeAutoDetected ? 'Detected from your email' : 'Select your college'}
          </option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {form.collegeAutoDetected && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-primary)', marginTop: 'var(--sp-1)', fontWeight: 500 }}>
            ✓ Auto-detected from your college email domain.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 180px' }}>
          <label style={labelStyle} htmlFor="ob-dept">Department</label>
          <input
            id="ob-dept"
            className="input-dark"
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="e.g. Computer Science"
          />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <label style={labelStyle} htmlFor="ob-year">Year</label>
          <select
            id="ob-year"
            className="input-dark"
            value={form.year || ''}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            style={{ cursor: 'pointer' }}
          >
            <option value="" disabled>Year</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
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
