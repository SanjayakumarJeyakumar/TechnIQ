export default function StepAvatar({ form, setForm, error }) {
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, avatarFile: file, avatarPreview: URL.createObjectURL(file) }))
  }

  const initial = (form.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)' }}>Add a profile photo</h2>
      <p>Optional, but profiles with a photo get more learning requests.</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', marginTop: 'var(--sp-4)' }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
          background: 'var(--violet-50)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          {form.avatarPreview ? (
            <img src={form.avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 32, fontWeight: 600, color: 'var(--violet-800)' }}>{initial}</span>
          )}
        </div>

        <div>
          <label
            htmlFor="ob-avatar"
            style={{
              display: 'inline-block', padding: 'var(--sp-2) var(--sp-4)',
              border: '1px solid var(--ink-100)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
            }}
          >
            {form.avatarFile ? 'Change photo' : 'Upload photo'}
          </label>
          <input
            id="ob-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-500)', marginTop: 'var(--sp-2)' }}>
            JPEG, PNG, or WEBP. Max 2MB.
          </p>
          {error && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 'var(--sp-1)' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
