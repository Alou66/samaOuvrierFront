import api from './api'

export const clientService = {
  getAllClients: ({ page = 0, size = 20 } = {}) =>
    api.get(`/api/admin/clients?page=${page}&size=${size}`).then((r) => r.data),

  suspendClient:   (id, reason) => api.post(`/api/admin/clients/${id}/suspend`,   { reason }).then((r) => r.data),
  unsuspendClient: (id)         => api.post(`/api/admin/clients/${id}/unsuspend`).then((r) => r.data),
}
