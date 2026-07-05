import api from './api'

const TOKEN_KEY = 'sama_token'

export const authService = {

  login: async ({ email, password }) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      localStorage.setItem(TOKEN_KEY, data.token)
      return { user: data.user }
    } catch (err) {
      const message = err.response?.data?.message ?? 'Erreur de connexion.'
      const status  = err.response?.status

      // Traduit les codes HTTP en raisons compréhensibles par AuthContext
      if (status === 401) return { blocked: true, reason: 'WRONG_PASSWORD' }
      if (status === 403) {
        const msg = err.response?.data?.message ?? ''
        if (msg.includes('suspendu'))             return { blocked: true, reason: 'SUSPENDED',             adminMessage: msg }
        if (msg.includes('vérification'))         return { blocked: true, reason: 'PENDING_VERIFICATION' }
        if (msg.includes("n'a pas été approuvé")) return { blocked: true, reason: 'REJECTED_VERIFICATION', adminMessage: msg }
        return { blocked: true, reason: 'SUSPENDED', adminMessage: msg }
      }
      if (status === 404) return { blocked: true, reason: 'NOT_FOUND' }
      return { blocked: true, reason: message }
    }
  },

  registerClient: async (data) => {
    const { data: resp } = await api.post('/api/auth/register/client', {
      nom:       data.nom,
      email:     data.email,
      telephone: data.telephone,
      password:  data.password,
      ville:     data.ville,
    })
    localStorage.setItem(TOKEN_KEY, resp.token)
    return resp.user
  },

  registerWorker: async (data) => {
    const form = new FormData()
    form.append('nom',               data.nom)
    form.append('email',             data.email)
    form.append('telephone',         data.telephone ?? '')
    form.append('password',          data.password)
    form.append('ville',             data.ville ?? '')
    form.append('metier',            data.metier)
    form.append('description',       data.description ?? '')
    form.append('yearsOfExperience', data.yearsOfExperience ?? 0)
    if (data.photoProfil)         form.append('photoProfil',         data.photoProfil)
    if (data.pieceIdentiteRecto)  form.append('pieceIdentiteRecto',  data.pieceIdentiteRecto)
    if (data.pieceIdentiteVerso)  form.append('pieceIdentiteVerso',  data.pieceIdentiteVerso)
    if (data.certificat)          form.append('certificat',          data.certificat)

    await api.post('/api/auth/register/worker', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // Pas de token — le dossier est en attente de validation admin
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
  },
}
