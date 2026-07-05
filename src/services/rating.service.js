import api from './api'

export const ratingService = {
  saveRating: (data) =>
    api.post('/api/ratings', {
      missionId: data.missionId,
      rating:    data.rating,
      comment:   data.comment,
    }).then((r) => r.data),

  getRatingsByWorker: (workerId) =>
    api.get(`/api/ratings/worker/${workerId}`).then((r) => r.data),

  getMyRatings: () => api.get('/api/ratings/my').then((r) => r.data),

  // Admin
  getAllRatings: ({ page = 0, size = 20 } = {}) =>
    api.get(`/api/ratings/admin?page=${page}&size=${size}`).then((r) => r.data),

  deleteRating: (id) => api.delete(`/api/ratings/${id}`).then((r) => r.data),
}
