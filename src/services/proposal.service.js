import api from './api'

export const proposalService = {
  createProposal: (data) =>
    api.post('/api/proposals', {
      requestId:                data.requestId,
      price:                    data.price,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      message:                  data.message,
    }).then((r) => r.data),

  getProposalsByRequest: (requestId) =>
    api.get(`/api/proposals/request/${requestId}`).then((r) => r.data),

  // Mes propositions (ouvrier connecté)
  getMyProposals: () => api.get('/api/proposals/my').then((r) => r.data),

  acceptProposal:   (id) => api.post(`/api/proposals/${id}/accept`).then((r) => r.data),
  rejectProposal:   (id) => api.post(`/api/proposals/${id}/reject`).then((r) => r.data),
  withdrawProposal: (id) => api.post(`/api/proposals/${id}/withdraw`).then((r) => r.data),
}
