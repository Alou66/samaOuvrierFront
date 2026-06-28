import api from './api'

// Statuts mission : PENDING → STARTED → COMPLETED | CANCELLED

export const missionService = {
  createMission: (data) =>
    api
      .post('/missions', {
        ...data,
        status: 'PENDING',
        acceptedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      })
      .then((r) => r.data),

  getMissionById: (id) => api.get(`/missions/${id}`).then((r) => r.data),

  getMissionsByWorker: (workerId) =>
    api.get(`/missions?workerId=${workerId}`).then((r) => r.data),

  getMissionsByClient: (clientId) =>
    api.get(`/missions?clientId=${clientId}`).then((r) => r.data),

  startMission: (id) =>
    api
      .patch(`/missions/${id}`, { status: 'STARTED', startedAt: new Date().toISOString() })
      .then((r) => r.data),

  completeMission: (id) =>
    api
      .patch(`/missions/${id}`, { status: 'COMPLETED', completedAt: new Date().toISOString() })
      .then((r) => r.data),

  cancelMission: (id) =>
      api.patch(`/missions/${id}`, { status: 'CANCELLED' }).then((r) => r.data),
}
