<template>
  <div>
    <div v-if="books.length === 0" class="empty">
      // список пуст — добавьте первую книгу
    </div>

    <div v-else class="books-grid">
      <BookItem
        v-for="book in books"
        :key="book.id"
        :book="book"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script>
import BookItem from './BookItem.vue'

export default {
  name: 'BookList',
  components: { BookItem },
  props: {
    books: { type: Array, required: true }
  },
  emits: ['edit', 'delete', 'toggle']
}
</script>