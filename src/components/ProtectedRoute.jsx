import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Routes liées à un rôle précis : pas besoin de redirect après login,
// l'utilisateur sera envoyé vers son propre dashboard.
const ROLE_SPECIFIC = ['/ouvrier/dashboard', '/admin']

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const isRoleRoute = ROLE_SPECIFIC.some((r) => location.pathname.startsWith(r))

    const to = isRoleRoute
      ? '/connexion'
      : `/connexion?redirect=${encodeURIComponent(location.pathname + location.search)}`

    return <Navigate to={to} replace />
  }

  return children
}
