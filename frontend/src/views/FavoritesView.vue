<template>
  <div>
    <h2 class="page-title">
      Избранное
      <span class="title-meta" v-if="favoriteBooks.length">
        [ {{ favoriteBooks.length }} ]
      </span>
    </h2>

    <p v-if="!isAuthenticated" class="form-hint" style="margin-bottom: 1.5rem">
      // вы не вошли в аккаунт. избранное хранится локально в браузере.
      <RouterLink to="/login">войти</RouterLink>, чтобы синхронизировать между
      устройствами.
    </p>

    <div v-if="loading" class="skeleton-grid">
      <BookCardSkeleton v-for="n in 6" :key="n" />
    </div>

    <EmptyState v-else-if="favoriteBooks.length === 0">
      <template #art>
        <svg
          viewBox="0 0 200 160"
          width="180"
          height="140"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M100 130 C 50 100, 25 70, 25 50 C 25 30, 45 20, 60 30 C 75 40, 80 50, 100 50 C 120 50, 125 40, 140 30 C 155 20, 175 30, 175 50 C 175 70, 150 100, 100 130 Z"
            fill="var(--paper)"
          />
        </svg>
      </template>
      <template #title>В избранном пусто</template>
      отметьте сердечком книги в каталоге — они появятся здесь
      <template #action>
        <RouterLink to="/books" class="btn">Открыть каталог</RouterLink>
      </template>
    </EmptyState>

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
import BookList from "@/components/BookList.vue";
import { bookService, favService } from "@/services/api.js";
import { useFavorites } from "@/composables/useFavorites.js";
import { useAuth } from "@/composables/useAuth.js";
import EmptyState from '@/components/EmptyState.vue'

export default {
  name: "FavoritesView",
  components: { BookList,  EmptyState },
  setup() {
    const { favoriteIds, syncWith } = useFavorites();
    const { isAuthenticated } = useAuth();
    return { favoriteIds, syncWith, isAuthenticated };
  },
  data() {
    return {
      allBooks: [], // для гостей — нужно для фильтрации по локальным id
      serverBooks: [], // для авторизованных — полный список с сервера
      loading: false,
      error: "",
    };
  },
  computed: {
    favoriteBooks() {
      if (this.isAuthenticated) {
        return this.serverBooks;
      }
      // Гость — фильтруем из всех книг по локальным id
      return this.allBooks.filter((b) => this.favoriteIds.has(b.id));
    },
  },
  async mounted() {
    await this.load();
  },
  watch: {
    isAuthenticated() {
      this.load(); // при смене авторизации — перезагружаем
    },
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = "";
      try {
        if (this.isAuthenticated) {
          // Один запрос — сразу полные данные избранных книг
          const { data } = await favService.getBooks();
          this.serverBooks = data;
        } else {
          // Гость — грузим весь каталог, фильтруем по localStorage id'шникам
          const { data } = await bookService.list();
          this.allBooks = data;
          this.syncWith(data.map((b) => b.id));
        }
      } catch (e) {
        this.error =
          "Не удалось загрузить: " + (e.response?.data?.detail || e.message);
      } finally {
        this.loading = false;
      }
    },
    goEdit(book) {
      this.$router.push({ name: "book-edit", params: { id: book.id } });
    },
    async confirmDelete(book) {
      if (!confirm(`Удалить «${book.title}»?`)) return;
      try {
        await bookService.remove(book.id);
        // Перезагружаем
        await this.load();
      } catch (e) {
        alert("Ошибка: " + (e.response?.data?.detail || e.message));
      }
    },
    async toggleStatus(book) {
      try {
        const { data } = await bookService.update(book.id, {
          ...book,
          in_stock: !book.in_stock,
        });
        // Обновляем в обоих местах
        const updateIn = (arr) => {
          const i = arr.findIndex((b) => b.id === book.id);
          if (i !== -1) arr[i] = data;
        };
        updateIn(this.allBooks);
        updateIn(this.serverBooks);
      } catch (e) {
        alert("Ошибка: " + (e.response?.data?.detail || e.message));
      }
    },
  },
};
</script>

<style scoped>
.title-meta {
  font-family: "Space Mono", monospace;
  font-size: 0.6em;
  margin-left: 0.5em;
  color: var(--accent);
  font-weight: 400;
}
</style>
