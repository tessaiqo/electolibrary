<template>
  <div>
    <div class="breadcrumbs">
      <RouterLink to="/books">← к каталогу</RouterLink>
    </div>

    <div v-if="loading" class="loading">// загружаем книгу…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="book">
      <article class="book-detail">
        <div class="book-detail__cover">
          <img
            :src="book.cover_url || PLACEHOLDER"
            :alt="book.title"
            @error="(e) => e.target.src = PLACEHOLDER"
          />
        </div>

        <div class="book-detail__info">
          <div class="tech-label">
            [ {{ book.year || '—' }} ] · {{ book.category }}
            <span class="dot-sep">·</span>
            <span :class="{ 'is-out': !book.in_stock }">
              {{ book.in_stock ? 'в наличии' : 'нет в наличии' }}
            </span>
          </div>

          <h1 class="book-detail__title">{{ book.title }}</h1>
          <p class="book-detail__author">{{ book.author }}</p>

          <dl class="book-detail__meta">
            <template v-if="book.publisher">
              <dt>Издательство</dt><dd>{{ book.publisher }}</dd>
            </template>
            <template v-if="book.year">
              <dt>Год</dt><dd>{{ book.year }}</dd>
            </template>
            <dt>Возраст</dt><dd>{{ book.category }}</dd>
            <dt>Добавлено</dt><dd>{{ formatDate(book.created_at) }}</dd>
          </dl>

          <div v-if="tagsArray.length" class="book-detail__tags">
            <span class="tag-label">Жанры/темы:</span>
            <span v-for="tag in tagsArray" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>

          <p v-if="book.description" class="book-detail__desc">
            {{ book.description }}
          </p>

          <div class="book-detail__actions">
            <button class="btn-small btn-edit" @click="goEdit">Редактировать</button>
            <button
              class="btn-small btn-toggle"
              :class="{ 'is-active': isFav }"
              @click="toggleFav(book.id)"
            >
              {{ isFav ? '✓ В избранном' : '+ В избранное' }}
            </button>
            <button class="btn-small btn-toggle" @click="onToggleStock">
              {{ book.in_stock ? '— выдать' : '+ вернуть' }}
            </button>
            <button class="btn-small btn-delete" @click="onDelete">Удалить</button>
          </div>
        </div>
      </article>

      <!-- Похожие книги -->
      <section v-if="similarBooks.length" class="similar-section">
        <div class="section-header">
          <h2>Похожие книги</h2>
          <div class="section-meta">
            // {{ similarBooks.length }} · {{ similarReason }}
          </div>
        </div>
        <BookList
          :books="similarBooks"
          @edit="goEditOther"
          @delete="onDeleteOther"
          @toggle="onToggleStockOther"
        />
      </section>
    </template>
  </div>
</template>

<script>
import BookList from '@/components/BookList.vue'
import { bookService } from '@/services/api.js'
import { useFavorites } from '@/composables/useFavorites.js'

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect fill="%23ecebe6" width="300" height="450"/><text x="50%" y="50%" font-family="monospace" font-size="18" fill="%23999" text-anchor="middle">[ no cover ]</text></svg>'

export default {
  name: 'BookDetailView',
  components: { BookList },
  props: {
    id: { type: [String, Number], required: true }
  },
  setup() {
    const { isFavorite, toggle, remove: favRemove } = useFavorites()
    return { isFavorite, toggleFav: toggle, favRemove }
  },
  data() {
    return {
      book: null,
      allBooks: [],
      loading: false,
      error: '',
      PLACEHOLDER
    }
  },
  computed: {
    isFav() {
      return this.book ? this.isFavorite(this.book.id) : false
    },
    tagsArray() {
      if (!this.book || !this.book.subjects) return []
      return this.book.subjects.split(',').map(t => t.trim()).filter(Boolean)
    },
    /**
     * Похожие книги: ищем по пересечению тегов (subjects).
     * Если у текущей книги нет тегов — fallback: книги того же автора.
     * Возвращаем топ-4.
     */
    similarBooks() {
      if (!this.book) return []
      const others = this.allBooks.filter(b => b.id !== this.book.id)

      if (this.tagsArray.length > 0) {
        const mySet = new Set(this.tagsArray.map(t => t.toLowerCase()))
        const scored = others.map(b => {
          const theirTags = (b.subjects || '').split(',').map(t => t.trim().toLowerCase())
          const common = theirTags.filter(t => t && mySet.has(t)).length
          return { book: b, common }
        }).filter(x => x.common > 0)

        scored.sort((a, b) => b.common - a.common)
        return scored.slice(0, 4).map(x => x.book)
      }

      // Fallback — тот же автор
      return others.filter(b => b.author === this.book.author).slice(0, 4)
    },
    similarReason() {
      return this.tagsArray.length > 0 ? 'по общим жанрам' : 'тот же автор'
    }
  },
  watch: {
    // При переходе с одной детальной на другую (из «похожих») — перезагружаем
    id: {
      immediate: true,
      handler() { this.loadAll() }
    }
  },
  methods: {
    async loadAll() {
      this.loading = true
      this.error = ''
      try {
        const [bookRes, allRes] = await Promise.all([
          bookService.get(this.id),
          bookService.list()
        ])
        this.book = bookRes.data
        this.allBooks = allRes.data
      } catch (e) {
        this.error = 'Не удалось загрузить: ' + (e.response?.data?.detail || e.message)
      } finally {
        this.loading = false
      }
    },

    formatDate(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },

    goEdit() {
      this.$router.push({ name: 'book-edit', params: { id: this.book.id } })
    },

    goEditOther(book) {
      this.$router.push({ name: 'book-edit', params: { id: book.id } })
    },

    async onToggleStock() {
      try {
        const { data } = await bookService.update(this.book.id, {
          ...this.book, in_stock: !this.book.in_stock
        })
        this.book = data
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    },

    async onToggleStockOther(book) {
      try {
        const { data } = await bookService.update(book.id, {
          ...book, in_stock: !book.in_stock
        })
        const i = this.allBooks.findIndex(b => b.id === book.id)
        if (i !== -1) this.allBooks[i] = data
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    },

    async onDelete() {
      if (!confirm(`Удалить «${this.book.title}»?`)) return
      try {
        await bookService.remove(this.book.id)
        this.favRemove(this.book.id)
        this.$router.push({ name: 'books' })
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    },

    async onDeleteOther(book) {
      if (!confirm(`Удалить «${book.title}»?`)) return
      try {
        await bookService.remove(book.id)
        this.favRemove(book.id)
        this.allBooks = this.allBooks.filter(b => b.id !== book.id)
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    }
  }
}
</script>