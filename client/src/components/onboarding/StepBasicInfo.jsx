const inputStyle = {
  width: '100%', padding: 'var(--sp-3) var(--sp-4)',
  border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)', background: 'var(--surface-1)', color: 'var(--ink-900)',
}

const labelStyle = {
  display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500,
  color: 'var(--ink-700)', marginBottom: 'var(--sp-2)',
}

export default function StepBasicInfo({ form, setForm, colleges }) {
  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>The basics</h2>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label style={labelStyle} htmlFor="ob-name">Full name</label>
        <input
          id="ob-name"
          style={inputStyle}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name"
        />
      </div>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label style={labelStyle} htmlFor="ob-college">College</label>
        <select
          id="ob-college"
          style={inputStyle}
          value={form.collegeId || ''}
          onChange={(e) => setForm((f) => ({ ...f, collegeId: e.target.value }))}
        >
          <option value="" disabled>
            {form.collegeAutoDetected ? 'Detected from your email' : 'Select your college'}
          </option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {form.collegeAutoDetected && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginTop: 'var(--sp-1)' }}>
            Detected from your college email — change it if that's wrong.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle} htmlFor="ob-dept">Department</label>
          <input
            id="ob-dept"
            style={inputStyle}
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="e.g. Computer Science"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="ob-year">Year</label>
          <select
            id="ob-year"
            style={inputStyle}
            value={form.year || ''}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
          >
            <option value="" disabled>Year</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
