import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import RegisterForm from '../../components/RegisterForm'

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

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const { user } = useAuth()

  // Si déjà connecté, redirige
  useEffect(() => {
    if (!user) return
    const dest =
      redirectTo ||
      (user.role === 'WORKER' ? '/ouvrier/dashboard' : user.role === 'ADMIN' ? '/admin' : '/')
    navigate(dest, { replace: true })
  }, [user])

  const handleSuccess = (role) => {
    if (role === 'WORKER') {
      // Dossier en attente de vérification → dashboard ouvrier
      navigate('/ouvrier/dashboard')
    } else {
      // CLIENT → page demande (ou redirect param)
      navigate(redirectTo || '/nouvelle-demande')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4">
        <AuthLogo />
        <button
          onClick={() => navigate('/connexion')}
          className="text-sm font-medium text-stone-600 hover:text-primary-700"
        >
          ← Retour connexion
        </button>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col items-center justify-start px-4 py-8">

        {/* Contexte si redirect */}
        {redirectTo && (
          <div className="mb-4 w-full max-w-sm rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
            <p className="text-sm font-medium text-primary-800">
              Créez votre compte pour continuer
            </p>
          </div>
        )}

        {/* Carte inscription */}
        <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-stone-900">Créer un compte</h1>
          <p className="mb-6 text-sm text-stone-500">
            Rejoignez SamaOuvrier — c'est gratuit.
          </p>

          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={() => navigate('/connexion')}
          />
        </div>
      </div>
    </div>
  )
}
