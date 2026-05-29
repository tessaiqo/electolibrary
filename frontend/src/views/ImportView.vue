<template>
  <div class="import-page">
    <div class="search-bar">
      <input
        v-model.trim="query"
        type="text"
        placeholder="название или автор в open library…"
        @keyup.enter="search"
      />
      <button class="btn" :disabled="loading || !query" @click="search">
        {{ loading ? '...' : 'Найти' }}
      </button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">// ищем в open library…</div>

    <div v-else-if="results.length" class="import-results">
      <div class="results-meta">
        Найдено: {{ totalFound }} · показано: {{ results.length }}
      </div>

      <div class="books-grid">
        <article
          v-for="book in results"
          :key="book.key"
          class="book-card"
        >
          <div class="tech-label">
            [ {{ book.year || '—' }} ] · openlib
          </div>

          <img
            :src="book.cover_url || PLACEHOLDER"
            :alt="book.title"
            class="book-cover"
            @error="(e) => e.target.src = PLACEHOLDER"
          />

          <h3 class="book-title">{{ book.title }}</h3>
          <p class="book-author">{{ book.author || 'неизв. автор' }}</p>

          <div class="book-actions">
            <button
              v-if="!isImported(book)"
              class="btn-small btn-toggle"
              :disabled="importingKey === book.key"
              @click="importBook(book)"
            >
              {{ importingKey === book.key ? '...' : '+ Импортировать' }}
            </button>
            <span v-else class="btn-small in-fav">✓ В каталоге</span>
          </div>
        </article>
      </div>
    </div>

    <div v-else-if="searched" class="empty">
      // ничего не найдено — попробуйте другой запрос
    </div>

    <div v-else class="empty">
      // введите запрос (например, «tolkien» или «достоевский»)
    </div>
  </div>
</template>

<script>
import { bookService } from '@/services/api.js'

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="%23ecebe6" width="200" height="300"/><text x="50%" y="50%" font-family="monospace" font-size="14" fill="%23999" text-anchor="middle">[ no cover ]</text></svg>'

export default {
  name: 'ImportView',
  data() {
    return {
      query: '',
      results: [],
      totalFound: 0,
      loading: false,
      searched: false,
      error: '',
      existingTitles: new Set(),
      importingKey: null,
      PLACEHOLDER
    }
  },
  async mounted() {
    try {
      const { data } = await bookService.list()
      data.forEach(b => {
        this.existingTitles.add(this.norm(b.title) + '|' + this.norm(b.author))
      })
    } catch (e) {
      // молча
    }
  },
  methods: {
    norm(s) { return (s || '').toLowerCase().trim() },

    isImported(book) {
      const k = this.norm(book.title) + '|' + this.norm(book.author)
      return this.existingTitles.has(k)
    },

    async search() {
      if (!this.query) return
      this.loading = true
      this.error = ''
      try {
        const { data } = await bookService.searchOpenLibrary(this.query)
        this.results = data.books
        this.totalFound = data.total
        this.searched = true
      } catch (e) {
        this.error = 'Ошибка поиска: ' + (e.response?.data?.detail || e.message)
      } finally {
        this.loading = false
      }
    },

    async importBook(book) {
      this.importingKey = book.key
      try {
        const payload = {
            title: book.title,
            author: book.author || 'неизв. автор',
            description: `Импортировано из Open Library (${book.key})`,
             publisher: '',
             year: book.year,
             category: '0+',
             cover_url: book.cover_url,
             subjects: (book.subjects || []).join(', '),   // ← добавили
             in_stock: true
             }
        await bookService.create(payload)
        this.existingTitles.add(this.norm(book.title) + '|' + this.norm(book.author))
      } catch (e) {
        alert('Не удалось импортировать: ' + (e.response?.data?.detail || e.message))
      } finally {
        this.importingKey = null
      }
    }
  }
}
</script>