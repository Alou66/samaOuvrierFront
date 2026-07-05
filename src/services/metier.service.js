import api from './api'

export const metierService = {
  getAllMetiers:  ()           => api.get('/api/metiers').then((r) => r.data),
  addMetier:     (name)       => api.post('/api/metiers', { name }).then((r) => r.data),
  updateMetier:  (id, name)   => api.put(`/api/metiers/${id}`, { name }).then((r) => r.data),
  deleteMetier:  (id)         => api.delete(`/api/metiers/${id}`).then((r) => r.data),
}
