import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NewRequestForm from '../../components/NewRequestForm'

function TopBar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <div className="flex items-center justify-between border-b border-stone-100 bg-white px-5 py-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
          S
        </span>
        <span className="text-lg font-bold text-stone-900">SamaOuvrier</span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            ← Retour
          </button>
        ) : (
          <>
            <Link
              to="/connexion"
              className="text-sm font-medium text-stone-500 hover:text-stone-800"
            >
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              S'inscrire
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function NewRequest() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <TopBar />
      <div className="flex flex-1 justify-center px-4 py-8">
        <div className="w-full max-w-xl pb-10">
          <NewRequestForm />
        </div>
      </div>
    </div>
  )
}
