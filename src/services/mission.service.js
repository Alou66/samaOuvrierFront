import api from './api'

export const missionService = {
  // Client connecté
  getMissionsByClient: () => api.get('/api/missions/client').then((r) => r.data),

  // Ouvrier connecté
  getMissionsByWorker: () => api.get('/api/missions/worker').then((r) => r.data),

  // Ouvrier connecté — historique paginé et filtrable des missions terminées
  getCompletedMissionsByWorker: ({ page = 0, size = 10, from, to, minRating, unratedOnly } = {}) => {
    const params = new URLSearchParams({ page, size })
    if (from)       params.set('from', from)
    if (to)         params.set('to', to)
    if (minRating)  params.set('minRating', minRating)
    if (unratedOnly) params.set('unratedOnly', 'true')
    return api.get(`/api/missions/worker/completed?${params.toString()}`).then((r) => r.data)
  },

  // Admin
  getAllMissions: ({ page = 0, size = 20 } = {}) =>
    api.get(`/api/missions/admin?page=${page}&size=${size}`).then((r) => r.data),

  getMissionById:  (id) => api.get(`/api/missions/${id}`).then((r) => r.data),

  startMission:    (id) => api.post(`/api/missions/${id}/start`).then((r) => r.data),
  completeMission: (id) => api.post(`/api/missions/${id}/complete`).then((r) => r.data),
  cancelMission:   (id) => api.post(`/api/missions/${id}/cancel`).then((r) => r.data),
}
