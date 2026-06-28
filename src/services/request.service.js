import api from './api'

// Statuts : OPEN → PROPOSALS_SENT → SELECTED → IN_PROGRESS → CLOSED | CANCELLED

export const requestService = {
  createRequest: (data) =>
    api
      .post('/requests', { ...data, status: 'OPEN', createdAt: new Date().toISOString() })
      .then((r) => r.data),

  getAllRequests: () => api.get('/requests').then((r) => r.data),

  getRequestById: (id) => api.get(`/requests/${id}`).then((r) => r.data),

  getRequestsByClient: (clientId) =>
    api.get(`/requests?clientId=${clientId}`).then((r) => r.data),

  /**
   * Toutes les demandes d'un métier donné (OPEN + PROPOSALS_SENT) pour la vue worker.
   * Le filtrage par statut se fait côté client.
   */
  getRequestsByMetier: (metier) =>
    api.get(`/requests?metier=${encodeURIComponent(metier)}`).then((r) => r.data),

  getRequestsByStatus: (status) =>
    api.get(`/requests?status=${status}`).then((r) => r.data),

  updateRequestStatus: (id, status) =>
    api.patch(`/requests/${id}`, { status }).then((r) => r.data),
}
