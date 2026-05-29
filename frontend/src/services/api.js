import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const bookService = {
  // CRUD
  list(params = {}) {
    return api.get('/books', { params })
  },
  get(id) {
    return api.get(`/books/${id}`)
  },
  create(payload) {
    return api.post('/books', payload)
  },
  update(id, payload) {
    return api.put(`/books/${id}`, payload)
  },
  remove(id) {
    return api.delete(`/books/${id}`)
  },

  // Загрузка обложки (multipart)
  uploadCover(file) {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/upload-cover', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Open Library — для импорта
  searchOpenLibrary(q, limit = 12) {
    return api.get('/openlibrary/search', { params: { q, limit } })
  }
}