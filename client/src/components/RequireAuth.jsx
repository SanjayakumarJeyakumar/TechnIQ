import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function RequireAuth({ children }) {
  const { session, loading, isOnboarded } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner label="Checking your session…" />

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
