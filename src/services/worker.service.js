import api from './api'

// Le backend renvoie les ouvriers sous la forme UserResponse avec les champs
// spécifiques au profil ouvrier imbriqués dans `workerProfile` (metier, note,
// verificationStatus…). Toutes les pages qui affichent des ouvriers (recherche,
// admin, fiche publique) attendent ces champs à plat sur l'objet. On les
// aplatit une seule fois ici pour ne pas dupliquer `worker.workerProfile?.x`
// dans chaque composant.
function flattenWorker(u) {
  if (!u) return u
  const { workerProfile: wp, photoProfilUrl, ...rest } = u
  return {
    ...rest,
    photoProfil: photoProfilUrl,
    metier: wp?.metier,
    description: wp?.description,
    yearsOfExperience: wp?.yearsOfExperience,
    note: wp?.note,
    avis: wp?.ratingCount,
    isAvailable: wp?.isAvailable,
    isVerified: wp?.isVerified,
    verificationStatus: wp?.verificationStatus,
    rejectionReason: wp?.rejectionReason,
    languages: wp?.languages,
    pieceIdentiteRecto: wp?.pieceIdentiteRectoUrl,
    pieceIdentiteVerso: wp?.pieceIdentiteVersoUrl,
    certificat: wp?.certificatUrl,
  }
}

function flattenPage(pageResponse) {
  return { ...pageResponse, content: pageResponse.content.map(flattenWorker) }
}

export const workerService = {

  // ── Public ──────────────────────────────────────────────────────────────
  getAllWorkers: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.metier      !== undefined) params.set('metier',      filters.metier)
    if (filters.ville       !== undefined) params.set('ville',       filters.ville)
    if (filters.isAvailable !== undefined) params.set('isAvailable', filters.isAvailable)
    if (filters.noteMin     !== undefined) params.set('noteMin',     filters.noteMin)
    if (filters.page        !== undefined) params.set('page',        filters.page)
    if (filters.size        !== undefined) params.set('size',        filters.size)
    const query = params.toString()
    return api.get(query ? `/api/workers?${query}` : '/api/workers').then((r) => flattenPage(r.data))
  },

  getWorkerById: (id) => api.get(`/api/workers/${id}`).then((r) => flattenWorker(r.data)),

  // ── Self (ouvrier connecté) ─────────────────────────────────────────────
  updateAvailability: (isAvailable) =>
    api.patch('/api/workers/me/availability', { available: isAvailable }).then((r) => r.data),

  // ── Admin ────────────────────────────────────────────────────────────────
  getAllWorkersAdmin: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.metier)             params.set('metier', filters.metier)
    if (filters.ville)              params.set('ville', filters.ville)
    if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus)
    if (filters.page !== undefined) params.set('page', filters.page)
    if (filters.size !== undefined) params.set('size', filters.size)
    const query = params.toString()
    return api.get(query ? `/api/admin/workers?${query}` : '/api/admin/workers').then((r) => flattenPage(r.data))
  },

  approveWorker:  (id)         => api.post(`/api/admin/workers/${id}/approve`).then((r) => r.data),
  rejectWorker:   (id, reason) => api.post(`/api/admin/workers/${id}/reject`,   { reason }).then((r) => r.data),
  suspendWorker:  (id, reason) => api.post(`/api/admin/workers/${id}/suspend`,  { reason }).then((r) => r.data),
  unsuspendWorker:(id)         => api.post(`/api/admin/workers/${id}/unsuspend`).then((r) => r.data),
}
