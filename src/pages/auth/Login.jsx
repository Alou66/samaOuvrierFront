import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoginForm from '../../components/LoginForm'

function AuthLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-base font-bold text-white">
        S
      </span>
      <span className="text-xl font-bold text-stone-900">SamaOuvrier</span>
    </div>
  )
}

// Destinations par défaut selon le rôle
const DEFAULT_DEST = {
  WORKER: '/ouvrier/dashboard',
  ADMIN:  '/admin',
  CLIENT: '/',
}

// Ces routes appartiennent à un rôle précis : ne jamais les utiliser
// comme redirect si le rôle connecté est différent.
const ROLE_ROUTES = {
  WORKER: '/ouvrier/dashboard',
  ADMIN:  '/admin',
}

function resolveDestination(role, redirectTo) {
  const fallback = DEFAULT_DEST[role] ?? '/'
  if (!redirectTo) return fallback

  // Ignorer le redirect s'il pointe vers le dashboard d'un autre rôle
  const isWrongRole = Object.entries(ROLE_ROUTES).some(
    ([r, path]) => r !== role && redirectTo.startsWith(path)
  )
  return isWrongRole ? fallback : redirectTo
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const { user } = useAuth()

  // Si déjà connecté, redirige immédiatement vers le bon endroit
  useEffect(() => {
    if (!user) return
    navigate(resolveDestination(user.role, redirectTo), { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = (role) => {
    navigate(resolveDestination(role, redirectTo))
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4">
        <AuthLogo />
        <p className="hidden text-sm text-stone-500 sm:block">
          Des ouvriers de confiance, près de chez vous.
        </p>
      </div>

      {/* Contenu centré */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 gap-4">

        {/* Message contextuel si redirect */}
        {redirectTo && (
          <div className="w-full max-w-sm rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
            <p className="text-sm font-medium text-primary-800">
              Connectez-vous pour continuer
            </p>
          </div>
        )}

        {/* Carte connexion */}
        <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-stone-900">Connexion</h1>
          <p className="mb-6 text-sm text-stone-500">Content de vous revoir !</p>

          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={() => navigate('/inscription')}
          />
        </div>

        {/* CTA : faire une demande */}
        <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            Vous avez besoin d'un ouvrier ?
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Créez votre compte client, décrivez votre besoin et recevez des propositions.
          </p>
          <button
            onClick={() => navigate('/nouvelle-demande')}
            className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Faire une demande d'intervention →
          </button>
        </div>

        {/* Séparateur */}
        <p className="text-xs text-stone-400">
          Ouvrier ?{' '}
          <button
            onClick={() => navigate('/inscription')}
            className="font-medium text-primary-600 hover:underline"
          >
            Inscrivez-vous ici
          </button>
        </p>
      </div>
    </div>
  )
}
