import api from './api'

export const ratingService = {
  saveRating: (data) => api.post('/ratings', data).then((r) => r.data),
  getRatingsByWorker: (workerId) =>
    api.get(`/ratings?workerId=${workerId}`).then((r) => r.data),
}
