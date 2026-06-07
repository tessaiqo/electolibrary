<template>
  <header class="topbar">
    <RouterLink to="/" class="logo">E-LIB®</RouterLink>

    <nav>
      <RouterLink to="/" exact-active-class="active">Главная</RouterLink>
      <RouterLink to="/books" active-class="active">Каталог</RouterLink>

      <RouterLink v-if="isAdmin" to="/books/new" active-class="active">
        Добавить
      </RouterLink>
      <RouterLink v-if="isAdmin" :to="{ name: 'books-import' }" active-class="active">
        Импорт
      </RouterLink>

      <RouterLink to="/favorites" active-class="active">
        Избранное<span v-if="favCount" class="nav-badge">{{ favCount }}</span>
      </RouterLink>
    </nav>

    <div class="user-area">
      <!-- Переключатель темы -->
      <button
        class="theme-toggle"
        :aria-label="theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'"
        @click="toggleTheme"
      >
        <span v-if="theme === 'dark'" class="theme-icon">☀</span>
        <span v-else class="theme-icon">☾</span>
      </button>

      <template v-if="!isAuthenticated">
        <RouterLink to="/login" class="user-link">Войти</RouterLink>
        <RouterLink to="/register" class="user-link user-link--accent">Регистрация</RouterLink>
      </template>

      <template v-else>
        <RouterLink to="/profile" class="user-link" :title="user.email">
          {{ shortEmail }}
          <span v-if="isAdmin" class="role-badge">ADMIN</span>
        </RouterLink>
        <button class="user-link user-logout" @click="onLogout">Выйти</button>
      </template>
    </div>
  </header>
</template>

<script>
import { useAuth } from '@/composables/useAuth.js'
import { useFavorites } from '@/composables/useFavorites.js'
import { useTheme } from '@/composables/useTheme.js'

export default {
  name: 'AppHeader',
  setup() {
    const { user, isAuthenticated, isAdmin, logout } = useAuth()
    const { count } = useFavorites()
    const { theme, toggle: toggleTheme } = useTheme()
    return { user, isAuthenticated, isAdmin, logout, favCount: count, theme, toggleTheme }
  },
  computed: {
    shortEmail() {
      if (!this.user?.email) return ''
      const e = this.user.email
      return e.length > 24 ? e.split('@')[0] : e
    }
  },
  methods: {
    onLogout() {
      this.logout()
      this.$router.push('/')
    }
  }
}
</script>