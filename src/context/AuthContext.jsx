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
  const login = async (email) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const result = await authService.login({ email })

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
   * Inscription — stratégie optimiste : user set immédiatement,
   * puis mis à jour avec l'id serveur.
   */
  const register = async (form, role = 'CLIENT') => {
    setAuthLoading(true)
    setAuthError(null)

    const optimisticUser = { nom: form.nom, email: form.email, telephone: form.telephone, ville: form.ville, role }
    saveUser(optimisticUser)

    try {
      let created
      if (role === 'CLIENT') {
        created = await authService.registerClient(form)
      } else {
        created = await authService.registerWorker(form)
      }
      saveUser(created)
    } catch (err) {
      console.error('[Auth] register error:', err)
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
