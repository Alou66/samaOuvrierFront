import api from './api'

export const clientService = {
  getAllClients: () => api.get('/clients').then((r) => r.data),

  suspendClient: (id, reason) =>
    api
      .patch(`/clients/${id}`, {
        isSuspended: true,
        suspensionReason: reason,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),

  unsuspendClient: (id) =>
    api
      .patch(`/clients/${id}`, {
        isSuspended: false,
        suspensionReason: null,
        updatedAt: new Date().toISOString(),
      })
      .then((r) => r.data),
}
