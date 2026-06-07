<template>
  <div>
    <h2 class="page-title">
      {{ isImport ? "Импорт из Open Library" : "Каталог" }}
    </h2>

    <template v-if="!isImport">
      <LayoutCard :items-count="filteredBooks.length">
        <template #header>Параметры списка</template>

        <!-- Поисковая строка -->
        <div class="filter-search">
          <input
            v-model.trim="searchQuery"
            type="text"
            placeholder="поиск по названию или автору…"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
            aria-label="очистить"
          >
            ×
          </button>
        </div>

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

          <RouterLink v-if="isAdmin" to="/books/new" class="btn"
            >+ Новая книга</RouterLink
          >
        </div>

        <template #footer="{ year, items }">
          // {{ items }} {{ pluralBooks(items) }} · обновлено в {{ year }}
        </template>
      </LayoutCard>

      <div v-if="error" class="error">{{ error }}</div>

      <div v-if="loading" class="skeleton-grid">
        <BookCardSkeleton v-for="n in 8" :key="n" />
      </div>
      <EmptyState v-else-if="searchQuery && filteredBooks.length === 0">
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
            <circle cx="85" cy="80" r="35" />
            <line x1="112" y1="107" x2="155" y2="150" />
            <line x1="70" y1="65" x2="100" y2="95" />
            <line x1="100" y1="65" x2="70" y2="95" />
          </svg>
        </template>
        <template #title>Ничего не найдено</template>
        по запросу «{{ searchQuery }}» нет совпадений в названиях и авторах
      </EmptyState>

      <BookList
        v-else
        :books="filteredBooks"
        :highlight-query="debouncedQuery"
        @edit="goEdit"
        @delete="confirmDelete"
        @toggle="toggleStatus"
      />
    </template>

    <RouterView />
  </div>
</template>

<script>
import LayoutCard from "@/components/LayoutCard.vue";
import BookList from "@/components/BookList.vue";
import { bookService } from "@/services/api.js";
import { useFavorites } from "@/composables/useFavorites.js";
import { useAuth } from "@/composables/useAuth.js";
import BookCardSkeleton from "@/components/BookCardSkeleton.vue";
import { useToast } from "@/composables/useToast.js";
import EmptyState from '@/components/EmptyState.vue'

export default {
  name: "BooksView",
  components: { LayoutCard, BookList, BookCardSkeleton, EmptyState },
  setup() {
    const { remove: favRemove } = useFavorites();
    const { isAdmin } = useAuth();
    const toast = useToast();
    return { favRemove, isAdmin, toast };
  },
  data() {
    return {
      books: [],
      loading: false,
      error: "",
      filterStatus: "all",
      sortKey: "created_desc",
      searchQuery: "",
      debouncedQuery: "",
      debounceTimer: null,
    };
  },
  computed: {
    isImport() {
      return this.$route.name === "books-import";
    },
    filteredBooks() {
      let arr = [...this.books];

      // Поиск по тексту (название + автор)
      if (this.debouncedQuery) {
        const q = this.debouncedQuery.toLowerCase();
        arr = arr.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q),
        );
      }

      // Фильтр по статусу
      if (this.filterStatus === "in") arr = arr.filter((b) => b.in_stock);
      if (this.filterStatus === "out") arr = arr.filter((b) => !b.in_stock);

      // Сортировка
      const cmp = {
        created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
        created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        title_asc: (a, b) => a.title.localeCompare(b.title, "ru"),
        title_desc: (a, b) => b.title.localeCompare(a.title, "ru"),
      };
      return arr.sort(cmp[this.sortKey] || cmp.created_desc);
    },
  },
  watch: {
    $route(to) {
      if (to.name === "books") this.loadBooks();
    },
    // Дебаунс поиска: пользователь печатает — ждём 250мс тишины,
    // чтобы не перефильтровывать на каждую букву
    searchQuery(val) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.debouncedQuery = val;
      }, 250);
    },
  },
  mounted() {
    if (!this.isImport) this.loadBooks();
  },
  beforeUnmount() {
    clearTimeout(this.debounceTimer);
  },
  methods: {
    async loadBooks() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await bookService.list();
        this.books = data;
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
        this.favRemove(book.id);
        this.books = this.books.filter((b) => b.id !== book.id);
        this.toast.success(`«${book.title}» удалена`);
      } catch (e) {
        this.toast.error("Ошибка: " + (e.response?.data?.detail || e.message));
      }
    },

    async toggleStatus(book) {
      try {
        const { data } = await bookService.update(book.id, {
          ...book,
          in_stock: !book.in_stock,
        });
        const i = this.books.findIndex((b) => b.id === book.id);
        if (i !== -1) this.books[i] = data;
        this.toast.info(data.in_stock ? "Книга в наличии" : "Книга выдана");
      } catch (e) {
        this.toast.error("Ошибка: " + (e.response?.data?.detail || e.message));
      }
    },

    pluralBooks(n) {
      const m = Math.abs(n) % 100,
        m1 = m % 10;
      if (m > 10 && m < 20) return "книг";
      if (m1 > 1 && m1 < 5) return "книги";
      if (m1 === 1) return "книга";
      return "книг";
    },
  },
};
</script>
