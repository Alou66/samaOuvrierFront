import api from './api'

// Statuts proposal : PENDING → ACCEPTED | REJECTED | EXPIRED

export const proposalService = {
  createProposal: (data) =>
    api
      .post('/proposals', { ...data, status: 'PENDING', createdAt: new Date().toISOString() })
      .then((r) => r.data),

  getProposalsByRequest: (requestId) =>
    api.get(`/proposals?requestId=${requestId}`).then((r) => r.data),

  getProposalsByWorker: (workerId) =>
    api.get(`/proposals?workerId=${workerId}`).then((r) => r.data),

  acceptProposal: (id) =>
    api.patch(`/proposals/${id}`, { status: 'ACCEPTED' }).then((r) => r.data),

  rejectProposal: (id) =>
    api.patch(`/proposals/${id}`, { status: 'REJECTED' }).then((r) => r.data),

  expireProposal: (id) =>
    api.patch(`/proposals/${id}`, { status: 'EXPIRED' }).then((r) => r.data),
}
