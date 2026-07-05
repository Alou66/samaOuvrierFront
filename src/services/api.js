import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8050',
  headers: { 'Content-Type': 'application/json' },
})

// Ajoute le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sama_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Sur 401 : vide le token et recharge la page (retour login)
// On ignore les appels de connexion/inscription : un 401 sur ces routes est une
// erreur d'identifiants normale, gérée localement par le formulaire (pas de redirection).
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((url) => error.config?.url?.includes(url))
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('sama_token')
      localStorage.removeItem('sama_user')
      window.location.href = '/connexion'
    }
    return Promise.reject(error)
  }
)

export default api
