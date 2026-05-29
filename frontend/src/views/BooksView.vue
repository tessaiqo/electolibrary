<template>
  <div>
    <!-- Заголовок меняется в зависимости от вложенного маршрута -->
    <h2 class="page-title">{{ isImport ? 'Импорт из Open Library' : 'Каталог' }}</h2>

    <!-- Каталог показываем ТОЛЬКО когда нет вложенного маршрута -->
    <template v-if="!isImport">
      <LayoutCard :items-count="filteredBooks.length">
        <template #header>Параметры списка</template>

        <div class="filters">
          <div class="filter-group">
            <label>Статус:</label>
            <select v-model="filterStatus">
              <option value="all">Все</option>
              <option value="in">В наличии</option>
              <option value="out">Нет в наличии</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Сортировка:</label>
            <select v-model="sortKey">
              <option value="created_desc">По дате (новые)</option>
              <option value="created_asc">По дате (старые)</option>
              <option value="title_asc">По алфавиту (А→Я)</option>
              <option value="title_desc">По алфавиту (Я→А)</option>
            </select>
          </div>

          <RouterLink to="/books/new" class="btn">+ Новая книга</RouterLink>
        </div>

        <template #footer="{ year, items }">
          // {{ items }} {{ pluralBooks(items) }} · обновлено в {{ year }}
        </template>
      </LayoutCard>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading" class="loading">// загружаем каталог…</div>

      <BookList
        v-else
        :books="filteredBooks"
        @edit="goEdit"
        @delete="confirmDelete"
        @toggle="toggleStatus"
      />
    </template>

    <!-- Вложенный роут (например, /books/import) -->
    <RouterView />
  </div>
</template>

<script>
import LayoutCard from '@/components/LayoutCard.vue'
import BookList from '@/components/BookList.vue'
import { bookService } from '@/services/api.js'
import { useFavorites } from '@/composables/useFavorites.js'

export default {
  name: 'BooksView',
  components: { LayoutCard, BookList },
  setup() {
    const { remove: favRemove } = useFavorites()
    return { favRemove }
  },
  data() {
    return {
      books: [],
      loading: false,
      error: '',
      filterStatus: 'all',
      sortKey: 'created_desc'
    }
  },
  computed: {
    isImport() {
      return this.$route.name === 'books-import'
    },
    filteredBooks() {
      let arr = [...this.books]
      if (this.filterStatus === 'in')  arr = arr.filter(b => b.in_stock)
      if (this.filterStatus === 'out') arr = arr.filter(b => !b.in_stock)

      const cmp = {
        created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
        created_asc:  (a, b) => new Date(a.created_at) - new Date(b.created_at),
        title_asc:    (a, b) => a.title.localeCompare(b.title, 'ru'),
        title_desc:   (a, b) => b.title.localeCompare(a.title, 'ru'),
      }
      return arr.sort(cmp[this.sortKey] || cmp.created_desc)
    }
  },
  watch: {
    '$route'(to) {
      // Перезагружаем список при возврате на /books
      if (to.name === 'books') this.loadBooks()
    }
  },
  mounted() {
    if (!this.isImport) this.loadBooks()
  },
  methods: {
    async loadBooks() {
      this.loading = true
      this.error = ''
      try {
        const { data } = await bookService.list()
        this.books = data
      } catch (e) {
        this.error = 'Не удалось загрузить: ' + (e.response?.data?.detail || e.message)
      } finally {
        this.loading = false
      }
    },

    goEdit(book) {
      this.$router.push({ name: 'book-edit', params: { id: book.id } })
    },

    async confirmDelete(book) {
      if (!confirm(`Удалить «${book.title}»?`)) return
      try {
        await bookService.remove(book.id)
        this.favRemove(book.id)
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
    },

    pluralBooks(n) {
      const m = Math.abs(n) % 100, m1 = m % 10
      if (m > 10 && m < 20) return 'книг'
      if (m1 > 1 && m1 < 5)  return 'книги'
      if (m1 === 1)          return 'книга'
      return 'книг'
    }
  }
}
</script>