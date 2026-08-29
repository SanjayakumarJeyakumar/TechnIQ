export default function StepAvatar({ form, setForm, error }) {
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, avatarFile: file, avatarPreview: URL.createObjectURL(file) }))
  }

  const initial = (form.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div>
      <h2 style={{ fontSize: 'var(--text-lg)', color: '#FFFFFF', marginBottom: 'var(--sp-1)' }}>Add a Profile Photo</h2>
      <p style={{ color: 'var(--ink-500)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
        Optional, but profiles with a photo receive significantly more learning requests.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-5)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--brand-subtle)',
          border: '2px solid var(--brand-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {form.avatarPreview ? (
            <img src={form.avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-primary)' }}>{initial}</span>
          )}
        </div>

        <div>
          <label
            htmlFor="ob-avatar"
            className="btn-secondary"
            style={{ cursor: 'pointer', display: 'inline-flex' }}
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
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 'var(--sp-1)', fontWeight: 500 }}>
              ✕ {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
