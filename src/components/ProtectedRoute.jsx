import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_DEFAULT = {
  WORKER: '/ouvrier/dashboard',
  ADMIN:  '/admin',
  CLIENT: '/',
}

const ROLE_SPECIFIC = ['/ouvrier/dashboard', '/admin']

/**
 * @param {string[]} [allowedRoles] — si fourni, redirige les autres rôles vers leur propre dashboard
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const isRoleRoute = ROLE_SPECIFIC.some((r) => location.pathname.startsWith(r))
    const to = isRoleRoute
      ? '/connexion'
      : `/connexion?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Navigate to={to} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DEFAULT[user.role] ?? '/'} replace />
  }

  return children
}
