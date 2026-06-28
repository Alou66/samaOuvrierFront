import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginForm({ onSuccess, onSwitchToRegister }) {
  const { login, authError, authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const loggedUser = await login(email)
    // onSuccess est appelé uniquement si la connexion a réussi
    if (loggedUser) {
      onSuccess?.(loggedUser.role)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value) }}
          required
          autoComplete="email"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        />
      </div>

      {/* Message d'erreur (compte bloqué, suspendu, non trouvé…) */}
      {authError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-sm font-medium text-red-700">{authError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={authLoading}
        className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {authLoading ? 'Connexion en cours…' : 'Se connecter'}
      </button>

      {onSwitchToRegister && (
        <p className="text-center text-sm text-stone-500">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary-600 hover:underline"
          >
            Inscrivez-vous
          </button>
        </p>
      )}
    </form>
  )
}
