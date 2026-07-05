import { createContext, useContext, useState } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

const STORAGE_KEY = 'sama_user'

function loadSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSavedUser)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  const AUTH_MESSAGES = {
    NOT_FOUND:             "Aucun compte trouvé avec cet email.",
    WRONG_PASSWORD:        "Mot de passe incorrect.",
    CLIENT_SUSPENDED:      "Votre compte client a été suspendu par l'administrateur.",
    SUSPENDED:             "Votre compte a été suspendu. Contactez l'administrateur.",
    PENDING_VERIFICATION:  "Votre dossier est en cours de vérification. Vous serez contacté une fois approuvé.",
    REJECTED_VERIFICATION: "Votre dossier n'a pas été approuvé. Contactez l'administrateur.",
  }

  const saveUser = (u) => {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  /**
   * Retourne l'objet user si la connexion réussit, null sinon.
   */
  const login = async (email, password) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const result = await authService.login({ email, password })

      if (result.blocked) {
        const base = AUTH_MESSAGES[result.reason] ?? 'Connexion refusée.'
        const full = result.adminMessage
          ? `${base} Motif : "${result.adminMessage}"`
          : base
        setAuthError(full)
        return null
      }

      saveUser(result.user)
      return result.user
    } catch (err) {
      setAuthError('Erreur de connexion au serveur.')
      console.error('[Auth] login error:', err)
      return null
    } finally {
      setAuthLoading(false)
    }
  }

  /**
   * Inscription.
   * - CLIENT : connecte directement, retourne { pending: false }
   * - WORKER : crée le compte mais NE connecte PAS (dossier en attente admin),
   *            retourne { pending: true }
   */
  const register = async (form, role = 'CLIENT') => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      if (role === 'CLIENT') {
        const created = await authService.registerClient(form)
        saveUser(created)
        return { pending: false }
      } else {
        await authService.registerWorker(form)
        // Worker non connecté — dossier soumis, en attente de validation admin
        return { pending: true }
      }
    } catch (err) {
      console.error('[Auth] register error:', err)
      const data = err.response?.data
      const message = data?.details?.[0] ?? data?.message
      setAuthError(message ?? "Une erreur s'est produite. Veuillez réessayer.")
      return { pending: false, error: true, message }
    } finally {
      setAuthLoading(false)
    }
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    saveUser(updated)
  }

  const logout = () => {
    setUser(null)
    setAuthError(null)
    localStorage.removeItem(STORAGE_KEY)
    authService.logout() // efface aussi sama_token
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, authLoading, authError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
