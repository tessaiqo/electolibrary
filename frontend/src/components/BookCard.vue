<template>
  <div class="book-card">
    <div class="tech-label">[ {{ book.year || '—' }} ] · book</div>
    <img
      :src="coverUrl"
      :alt="book.title"
      class="book-cover"
      @error="onImageError"
    />
    <h3 class="book-title">{{ book.title }}</h3>
    <p class="book-author">{{ book.author || 'неизв. автор' }}</p>
    <div class="book-actions">
      <button
        v-if="!isFavorite"
        class="btn-small"
        @click="$emit('add', book)"
      >
        ★ В избранное
      </button>
      <span v-else class="btn-small in-fav">✓ В избранном</span>
    </div>
  </div>
</template>

<script>
const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="%23ecebe6" width="200" height="300"/><text x="50%" y="50%" font-family="monospace" font-size="14" fill="%23999" text-anchor="middle">[ no cover ]</text></svg>'

export default {
  name: 'BookCard',
  props: {
    book: { type: Object, required: true },
    isFavorite: { type: Boolean, default: false }
  },
  emits: ['add'],
  computed: {
    coverUrl() { return this.book.cover_url || PLACEHOLDER }
  },
  methods: {
    onImageError(e) { e.target.src = PLACEHOLDER }
  }
}
</script>