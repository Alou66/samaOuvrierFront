import api from './api'

// Endpoints JSON Server + Spring Boot : GET/PATCH /workers, GET /workers/:id

export const workerService = {
  getAllWorkers: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.metier) params.set('metier', filters.metier)
    if (filters.ville) params.set('ville', filters.ville)
    if (filters.isAvailable !== undefined) params.set('isAvailable', filters.isAvailable)
    if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus)
    const query = params.toString()
    return api.get(query ? `/workers?${query}` : '/workers').then((r) => r.data)
  },

  getWorkerById: (id) => api.get(`/workers/${id}`).then((r) => r.data),

  updateAvailability: (id, isAvailable) =>
    api
      .patch(`/workers/${id}`, { isAvailable, updatedAt: new Date().toISOString() })
      .then((r) => r.data),

  // ─── Actions admin ────────────────────────────────────────────────────────

  approveWorker: (id) =>
    api
      .patch(`/workers/${id}`, {
        verificationStatus: 'APPROVED',
        isVerified: true,
        rejectionReason: null,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  rejectWorker: (id, reason) =>
    api
      .patch(`/workers/${id}`, {
        verificationStatus: 'REJECTED',
        isVerified: false,
        isAvailable: false,
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  suspendWorker: (id, reason) =>
    api
      .patch(`/workers/${id}`, {
        isSuspended: true,
        isAvailable: false,
        suspensionReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  unsuspendWorker: (id) =>
    api
      .patch(`/workers/${id}`, {
        isSuspended: false,
        suspensionReason: null,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),
}
