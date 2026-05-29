<template>
  <div>
    <h2 class="page-title">
      Избранное
      <span class="title-meta" v-if="favoriteBooks.length">
        [ {{ favoriteBooks.length }} ]
      </span>
    </h2>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">// загружаем…</div>

    <div v-else-if="favoriteBooks.length === 0" class="empty">
      // пусто. отметьте книги сердечком в каталоге
      <div style="margin-top: 1rem">
        <RouterLink to="/books" class="btn">Открыть каталог</RouterLink>
      </div>
    </div>

    <BookList
      v-else
      :books="favoriteBooks"
      @edit="goEdit"
      @delete="confirmDelete"
      @toggle="toggleStatus"
    />
  </div>
</template>

<script>
import BookList from '@/components/BookList.vue'
import { bookService } from '@/services/api.js'
import { useFavorites } from '@/composables/useFavorites.js'

export default {
  name: 'FavoritesView',
  components: { BookList },
  setup() {
    const { favoriteIds, syncWith } = useFavorites()
    return { favoriteIds, syncWith }
  },
  data() {
    return {
      books: [],
      loading: false,
      error: ''
    }
  },
  computed: {
    favoriteBooks() {
      return this.books.filter(b => this.favoriteIds.has(b.id))
    }
  },
  async mounted() {
    this.loading = true
    try {
      const { data } = await bookService.list()
      this.books = data
      // Синхронизируем localStorage с актуальным состоянием БД
      this.syncWith(data.map(b => b.id))
    } catch (e) {
      this.error = 'Не удалось загрузить: ' + (e.response?.data?.detail || e.message)
    } finally {
      this.loading = false
    }
  },
  methods: {
    goEdit(book) {
      this.$router.push({ name: 'book-edit', params: { id: book.id } })
    },
    async confirmDelete(book) {
      if (!confirm(`Удалить «${book.title}»?`)) return
      try {
        await bookService.remove(book.id)
        this.books = this.books.filter(b => b.id !== book.id)
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    },
    async toggleStatus(book) {
      try {
        const { data } = await bookService.update(book.id, {
          ...book, in_stock: !book.in_stock
        })
        const i = this.books.findIndex(b => b.id === book.id)
        if (i !== -1) this.books[i] = data
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    }
  }
}
</script>

<style scoped>
.title-meta {
  font-family: 'Space Mono', monospace;
  font-size: 0.6em;
  margin-left: 0.5em;
  color: var(--accent);
  font-weight: 400;
}
</style>