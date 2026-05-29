<template>
  <header class="topbar">
    <RouterLink to="/" class="logo">E-LIB®</RouterLink>
    <nav>
      <RouterLink to="/" exact-active-class="active">Главная</RouterLink>
      <RouterLink to="/books" active-class="active">Каталог</RouterLink>
      <RouterLink to="/books/new" active-class="active">Добавить</RouterLink>
      <RouterLink :to="{ name: 'books-import' }" active-class="active">Импорт</RouterLink>
      <RouterLink to="/favorites" active-class="active">
        Избранное<span v-if="favCount" class="nav-badge">{{ favCount }}</span>
      </RouterLink>
    </nav>
    <div class="meta">[ v1.0 · 2026 ]</div>
  </header>
</template>

<script>
import { useFavorites } from '@/composables/useFavorites.js'

export default {
  name: 'AppHeader',
  setup() {
    const { count } = useFavorites()
    return { favCount: count }
  }
}
</script>