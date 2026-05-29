<template>
  <div>
    <!-- TOPBAR -->
    <header class="topbar">
      <div class="logo">E-LIB®</div>
      <nav>
        <a @click="activeTab = 'search'">Каталог</a>
        <a @click="loadFavorites">Избранное</a>
        <a>О проекте</a>
        <a>Контакты</a>
      </nav>
      <div>[ {{ favorites.length }} в избранном ]</div>
    </header>

    <!-- HERO -->
    <section class="hero">
      <div class="section-num">01 / Главная</div>
      <h1>
        Электронная<br>
        <span class="accent">Библиотека</span>
      </h1>
      <p class="lead">
        Прототип каталога книг на базе Open Library API.
        Vue 3 · Vite · FastAPI · Docker · Nginx — учебный проект.
      </p>
    </section>

    <!-- TABS -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'search' }"
        @click="activeTab = 'search'"
      >
        ▸ Поиск
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'favorites' }"
        @click="loadFavorites"
      >
        ★ Избранное [{{ favorites.length }}]
      </button>
    </div>

    <!-- SEARCH TAB -->
    <div v-if="activeTab === 'search'">
      <div class="search-bar">
        <input
          v-model="query"
          type="text"
          placeholder="название книги или автор…"
          @keyup.enter="searchBooks"
        />
        <button class="btn" :disabled="loading" @click="searchBooks">
          {{ loading ? '...' : 'Найти →' }}
        </button>
      </div>

      <div class="section-header">
        <h2>{{ searched ? 'Результаты' : 'Каталог' }}</h2>
        <div class="section-meta">
          [{{ results.length }} {{ resultsLabel }}] · openlibrary.org
        </div>
      </div>

      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="loading" class="loading">// загружаем…</div>

      <div v-else-if="results.length" class="books-grid">
        <BookCard
          v-for="book in results"
          :key="book.key"
          :book="book"
          :is-favorite="isFavorite(book)"
          @add="addToFavorites"
        />
      </div>

      <div v-else-if="searched" class="empty">
        // ничего не найдено — попробуйте другой запрос
      </div>

      <div v-else class="empty">
        // введите запрос, чтобы начать поиск 📖
      </div>
    </div>

    <!-- FAVORITES TAB -->
    <div v-else>
      <div class="section-header">
        <h2>★ Избранное</h2>
        <div class="section-meta">
          [{{ favorites.length }} {{ favLabel }}] · локальное хранилище
        </div>
      </div>

      <div v-if="favorites.length" class="books-grid">
        <BookCard
          v-for="book in favorites"
          :key="book.key"
          :book="book"
          :is-favorite="true"
        />
      </div>
      <div v-else class="empty">
        // пусто. добавьте книги через поиск ★
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
      <div>© 2026 · E-Library prototype</div>
      <div>vue · fastapi · open library</div>
    </footer>
  </div>
</template>

<script>
import BookCard from './components/BookCard.vue'
import { bookService } from './services/api.js'

const plural = (n, forms) => {
  const m = Math.abs(n) % 100, m1 = m % 10
  if (m > 10 && m < 20) return forms[2]
  if (m1 > 1 && m1 < 5) return forms[1]
  if (m1 === 1) return forms[0]
  return forms[2]
}

export default {
  name: 'App',
  components: { BookCard },
  data() {
    return {
      activeTab: 'search',
      query: '',
      results: [],
      favorites: [],
      loading: false,
      searched: false,
      error: ''
    }
  },
  computed: {
    resultsLabel() { return plural(this.results.length, ['книга', 'книги', 'книг']) },
    favLabel()     { return plural(this.favorites.length, ['книга', 'книги', 'книг']) }
  },
  mounted() {
    this.loadFavoritesSilent()
  },
  methods: {
    async searchBooks() {
      if (!this.query.trim()) return
      this.loading = true
      this.error = ''
      try {
        const { data } = await bookService.searchBooks(this.query)
        this.results = data.books || []
        this.searched = true
      } catch (e) {
        this.error = 'Ошибка при поиске: ' + (e.response?.data?.detail || e.message)
      } finally {
        this.loading = false
      }
    },
    async loadFavorites() {
      this.activeTab = 'favorites'
      await this.loadFavoritesSilent()
    },
    async loadFavoritesSilent() {
      try {
        const { data } = await bookService.getFavorites()
        this.favorites = data.books || []
      } catch (e) {
        // молча
      }
    },
    async addToFavorites(book) {
      try {
        await bookService.addToFavorites(book)
        await this.loadFavoritesSilent()
      } catch (e) {
        this.error = 'Не удалось добавить: ' + (e.response?.data?.detail || e.message)
      }
    },
    isFavorite(book) {
      return this.favorites.some(f => f.key === book.key)
    }
  }
}
</script>