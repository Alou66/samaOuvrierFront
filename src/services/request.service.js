import api from './api'

export const requestService = {

  // Crée une demande avec photo optionnelle (multipart)
  createRequest: (data) => {
    const form = new FormData()
    form.append('metier',      data.metier)
    form.append('ville',       data.ville       ?? '')
    form.append('adresse',     data.adresse     ?? '')
    form.append('description', data.description ?? '')
    form.append('urgency',     data.urgency     ?? 'NORMAL')
    if (data.budget != null) form.append('budget', data.budget)
    if (data.photo)          form.append('photo',  data.photo)
    return api.post('/api/requests', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  // Mes demandes (client connecté)
  getMyRequests: () => api.get('/api/requests/my').then((r) => r.data),

  // Demandes disponibles pour les ouvriers (filtres optionnels)
  getAvailableRequests: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.metier) params.set('metier', filters.metier)
    if (filters.ville)  params.set('ville', filters.ville)
    const query = params.toString()
    return api.get(query ? `/api/requests/available?${query}` : '/api/requests/available').then((r) => r.data)
  },

  // Admin : toutes les demandes
  getAllRequests: ({ page = 0, size = 20 } = {}) =>
    api.get(`/api/requests/admin?page=${page}&size=${size}`).then((r) => r.data),

  // Le backend n'expose pas GET /api/requests/{id} — endpoint supprimé.

  // PUT accepte uniquement description, budget, urgency (UpdateRequestDto côté backend)
  updateRequest: (id, data) =>
    api.put(`/api/requests/${id}`, {
      description: data.description ?? null,
      budget:      data.budget      ?? null,
      urgency:     data.urgency     ?? null,
    }).then((r) => r.data),

  cancelRequest: (id) => api.patch(`/api/requests/${id}/cancel`).then((r) => r.data),
  deleteRequest: (id) => api.delete(`/api/requests/${id}`).then((r) => r.data),
}
