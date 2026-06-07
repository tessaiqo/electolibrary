import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Перед каждым запросом подкладываем токен, если он есть
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('electolibrary:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// При 401 (токен истёк/невалиден) — чистим сессию
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('electolibrary:token')
      localStorage.removeItem('electolibrary:user')
    }
    return Promise.reject(error)
  }
)

export const bookService = {
  list(params = {}) { return api.get('/books', { params }) },
  get(id)           { return api.get(`/books/${id}`) },
  create(payload)   { return api.post('/books', payload) },
  update(id, p)     { return api.put(`/books/${id}`, p) },
  remove(id)        { return api.delete(`/books/${id}`) },

  uploadCover(file) {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/upload-cover', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  searchOpenLibrary(q, limit = 12) {
    return api.get('/openlibrary/search', { params: { q, limit } })
  }
}

export const favService = {
  getIds()              { return api.get('/favorites') },
  getBooks()            { return api.get('/favorites/books') },
  add(book_id)          { return api.post('/favorites', { book_id }) },
  remove(book_id)       { return api.delete(`/favorites/${book_id}`) },
  merge(ids)            { return api.post('/favorites/merge', { ids }) }
}

// Глобальный axios тоже использует тот же интерцептор для useAuth.login/register
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('electolibrary:token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})