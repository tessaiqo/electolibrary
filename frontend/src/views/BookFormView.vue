<template>
  <div>
    <h2 class="page-title">{{ isEdit ? 'Редактирование' : 'Новая книга' }}</h2>

    <LayoutCard>
      <template #header>
        {{ isEdit ? `id: ${id}` : 'Заполните поля' }}
      </template>

      <div v-if="loading" class="loading">// загружаем данные книги…</div>

      <BookForm
        v-else
        :initial="bookData"
        :is-edit="isEdit"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </LayoutCard>
  </div>
</template>

<script>
import LayoutCard from '@/components/LayoutCard.vue'
import BookForm from '@/components/BookForm.vue'
import { bookService } from '@/services/api.js'

export default {
  name: 'BookFormView',
  components: { LayoutCard, BookForm },
  props: {
    id: { type: [String, Number], default: null }
  },
  data() {
    return {
      bookData: null,
      loading: false
    }
  },
  computed: {
    isEdit() { return !!this.id }
  },
  async mounted() {
    if (this.isEdit) {
      this.loading = true
      try {
        const { data } = await bookService.get(this.id)
        this.bookData = data
      } catch (e) {
        alert('Книга не найдена')
        this.$router.push({ name: 'books' })
      } finally {
        this.loading = false
      }
    }
  },
  methods: {
    async onSubmit(payload) {
      try {
        if (this.isEdit) {
          await bookService.update(this.id, payload)
        } else {
          await bookService.create(payload)
        }
        this.$router.push({ name: 'books' })
      } catch (e) {
        alert('Ошибка: ' + (e.response?.data?.detail || e.message))
      }
    },
    onCancel() {
      this.$router.push({ name: 'books' })
    }
  }
}
</script>