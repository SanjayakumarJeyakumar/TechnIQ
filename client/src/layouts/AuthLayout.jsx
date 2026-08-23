import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--surface-0)', padding: 'var(--sp-5)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Outlet />
      </div>
    </div>
  )
}
