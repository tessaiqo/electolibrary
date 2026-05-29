import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const bookService = {
  // GET — поиск книг через бэкенд (который ходит в Open Library API)
  searchBooks(query, limit = 12) {
    return api.get('/books/search', { params: { q: query, limit } })
  },

  // GET — получить избранное (хранится на бэкенде)
  getFavorites() {
    return api.get('/books/favorites')
  },

  // POST — добавить книгу в избранное
  addToFavorites(book) {
    return api.post('/books/favorites', book)
  }
}