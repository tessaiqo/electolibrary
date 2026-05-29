<template>
  <article class="book-card">
    <div class="card-top">
      <div class="tech-label">
        [ {{ book.year || '—' }} ] · {{ book.category }}
      </div>
      <button
        class="fav-btn"
        :class="{ 'is-active': fav }"
        :aria-label="fav ? 'Убрать из избранного' : 'В избранное'"
        @click.stop="onToggleFav"
      >
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            :fill="fav ? 'var(--accent)' : 'none'"
            stroke="var(--ink)"
            stroke-width="2"
            stroke-linejoin="round"
            d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12c-2.5 4.5-9.5 9-9.5 9z"
          />
        </svg>
      </button>
    </div>

    <RouterLink :to="{ name: 'book-detail', params: { id: book.id } }" class="book-card__link">
      <img
        :src="coverUrl"
        :alt="book.title"
        class="book-cover"
        @error="onImageError"
      />
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-author">{{ book.author }}</p>
    </RouterLink>

    <p v-if="book.publisher" class="book-meta">{{ book.publisher }}</p>

    <div class="book-status" :class="{ 'is-out': !book.in_stock }">
      <span class="dot"></span>
      {{ book.in_stock ? 'в наличии' : 'нет в наличии' }}
    </div>

    <div class="book-actions">
      <button class="btn-small btn-edit" @click="$emit('edit', book)">
        Редакт.
      </button>
      <button class="btn-small btn-toggle" @click="$emit('toggle', book)">
        {{ book.in_stock ? '— выдать' : '+ вернуть' }}
      </button>
      <button class="btn-small btn-delete" @click="$emit('delete', book)">
        Удалить
      </button>
    </div>
  </article>
</template>

    

<script>
import { useFavorites } from '@/composables/useFavorites.js'

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="%23ecebe6" width="200" height="300"/><text x="50%" y="50%" font-family="monospace" font-size="14" fill="%23999" text-anchor="middle">[ no cover ]</text></svg>'

export default {
  name: 'BookItem',
  props: {
    book: { type: Object, required: true }
  },
  emits: ['edit', 'delete', 'toggle'],
  setup() {
    const { isFavorite, toggle } = useFavorites()
    return { isFavorite, toggleFav: toggle }
  },
  computed: {
    coverUrl() {
      return this.book.cover_url || PLACEHOLDER
    },
    fav() {
      return this.isFavorite(this.book.id)
    }
  },
  methods: {
    onImageError(e) { e.target.src = PLACEHOLDER },
    onToggleFav() { this.toggleFav(this.book.id) },
    openDetail() {
      this.$router.push({ name: 'book-detail', params: { id: this.book.id } })
    }
  }
}
</script>