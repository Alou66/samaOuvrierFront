import api from './api'

export const villeService = {
  getAllVilles: () => api.get('/api/cities').then((r) => r.data),
  addVille:    (nom) => api.post('/api/cities', { name: nom }).then((r) => r.data),
  deleteVille: (id)  => api.delete(`/api/cities/${id}`).then((r) => r.data),
}
