import api from './api'

// ─── Contrats d'API ──────────────────────────────────────────────────────────
// JSON Server  →  GET /clients?email=…   GET /workers?email=…   GET /admins?email=…
// Spring Boot  →  POST /auth/login        (remplace les trois GET ci-dessus)
// Spring Boot  →  GET  /auth/me           (getCurrentUser avec JWT)

export const authService = {
  registerClient: (data) =>
    api
      .post('/clients', {
        ...data,
        role: 'CLIENT',
        photoProfil: null,
        isSuspended: false,
        suspensionReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  registerWorker: (data) => {
    // Séparer les champs fichiers des autres pour éviter de les écraser par null
    const { photoProfil, pieceIdentiteRecto, pieceIdentiteVerso, certificat, ...rest } = data
    return api
      .post('/workers', {
        ...rest,
        role: 'WORKER',
        isAvailable: true,
        isVerified: false,
        isSuspended: false,
        verificationStatus: 'PENDING',
        rejectionReason: null,
        suspensionReason: null,
        note: 0,
        avis: 0,
        photoProfil: photoProfil ?? null,
        pieceIdentiteRecto: pieceIdentiteRecto ?? null,
        pieceIdentiteVerso: pieceIdentiteVerso ?? null,
        certificat: certificat ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data)
  },

  /**
   * Cherche l'email dans /clients, /workers, puis /admins.
   *
   * Retourne :
   *   { user }                            — connexion autorisée
   *   { blocked: true, reason: string }   — connexion refusée (voir raisons ci-dessous)
   *
   * Raisons possibles :
   *   'NOT_FOUND'               — aucun compte avec cet email
   *   'CLIENT_SUSPENDED'        — compte client suspendu par l'admin
   *   'SUSPENDED'               — compte ouvrier suspendu par l'admin
   *   'PENDING_VERIFICATION'    — dossier ouvrier en cours de vérification
   *   'REJECTED_VERIFICATION'   — dossier ouvrier rejeté
   *
   * Migration Spring Boot : remplacer par
   *   api.post('/auth/login', { email, password }).then((r) => r.data)
   */
  login: async ({ email }) => {
    const [clientsRes, workersRes, adminsRes] = await Promise.all([
      api.get(`/clients?email=${encodeURIComponent(email)}`),
      api.get(`/workers?email=${encodeURIComponent(email)}`),
      api.get(`/admins?email=${encodeURIComponent(email)}`),
    ])

    if (clientsRes.data.length > 0) {
      const client = clientsRes.data[0]
      if (client.isSuspended) {
        return { blocked: true, reason: 'CLIENT_SUSPENDED', adminMessage: client.suspensionReason }
      }
      return { user: client }
    }

    if (workersRes.data.length > 0) {
      const worker = workersRes.data[0]

      if (worker.isSuspended) {
        return { blocked: true, reason: 'SUSPENDED', adminMessage: worker.suspensionReason }
      }
      if (worker.verificationStatus === 'PENDING') {
        return { blocked: true, reason: 'PENDING_VERIFICATION' }
      }
      if (worker.verificationStatus === 'REJECTED') {
        return { blocked: true, reason: 'REJECTED_VERIFICATION', adminMessage: worker.rejectionReason }
      }

      return { user: worker }
    }

    if (adminsRes.data.length > 0) return { user: adminsRes.data[0] }

    return { blocked: true, reason: 'NOT_FOUND' }
  },

  /**
   * Migration Spring Boot : remplacer par api.get('/auth/me').then((r) => r.data)
   */
  getCurrentUser: (id, role) => {
    const collection =
      role === 'WORKER' ? 'workers' : role === 'ADMIN' ? 'admins' : 'clients'
    return api.get(`/${collection}/${id}`).then((r) => r.data)
  },
}
