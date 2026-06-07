<template>
  <div class="profile-page">
    <h2 class="page-title">Профиль</h2>

    <LayoutCard>
      <template #header>Учётная запись</template>

      <div class="profile-grid">
        <div class="profile-avatar">
          <div class="avatar-circle">
            {{ initial }}
          </div>
          <div v-if="isAdmin" class="role-badge profile-role">ADMIN</div>
        </div>

        <dl class="profile-meta">
          <dt>Email</dt><dd>{{ user.email }}</dd>
          <dt>ID</dt><dd>#{{ user.id }}</dd>
          <dt>Роль</dt>
          <dd>{{ isAdmin ? 'Администратор' : 'Пользователь' }}</dd>
          <dt>В избранном</dt><dd>{{ favCount }} {{ pluralBooks(favCount) }}</dd>
        </dl>
      </div>

      <template #footer>
        // сессия хранится в localStorage этого браузера
      </template>
    </LayoutCard>

    <LayoutCard>
      <template #header>Возможности</template>

      <ul class="profile-perms">
        <li class="perm">
          <span class="perm-mark perm-yes">✓</span>
          Просматривать каталог и детали книг
        </li>
        <li class="perm">
          <span class="perm-mark perm-yes">✓</span>
          Добавлять книги в избранное
        </li>
        <li class="perm">
          <span class="perm-mark" :class="isAdmin ? 'perm-yes' : 'perm-no'">
            {{ isAdmin ? '✓' : '✗' }}
          </span>
          Создавать, редактировать и удалять книги
        </li>
        <li class="perm">
          <span class="perm-mark" :class="isAdmin ? 'perm-yes' : 'perm-no'">
            {{ isAdmin ? '✓' : '✗' }}
          </span>
          Импортировать книги из Open Library
        </li>
      </ul>
    </LayoutCard>

    <div class="profile-actions">
      <button class="btn" @click="onLogout">Выйти из аккаунта</button>
    </div>
  </div>
</template>

<script>
import LayoutCard from '@/components/LayoutCard.vue'
import { useAuth } from '@/composables/useAuth.js'
import { useFavorites } from '@/composables/useFavorites.js'

export default {
  name: 'ProfileView',
  components: { LayoutCard },
  setup() {
    const { user, isAdmin, logout } = useAuth()
    const { count } = useFavorites()
    return { user, isAdmin, logout, favCount: count }
  },
  computed: {
    initial() {
      return (this.user?.email || '?').charAt(0).toUpperCase()
    }
  },
  methods: {
    onLogout() {
      this.logout()
      this.$router.push('/')
    },
    pluralBooks(n) {
      const m = Math.abs(n) % 100, m1 = m % 10
      if (m > 10 && m < 20) return 'книг'
      if (m1 > 1 && m1 < 5)  return 'книги'
      if (m1 === 1)          return 'книга'
      return 'книг'
    }
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 700px;
  margin: 0 auto;
}

.profile-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.profile-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--paper);
  font-family: 'Bowlby One', sans-serif;
  font-size: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--ink);
}

.profile-role {
  font-size: 0.7rem;
  padding: 3px 8px;
}

.profile-meta {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem 1rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.85rem;
}

.profile-meta dt {
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.05em;
}

.profile-meta dd {
  font-weight: 700;
  word-break: break-all;
}

.profile-perms {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
}

.perm {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.perm-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
}

.perm-yes {
  background: var(--bg);
  color: var(--ink);
  border: 1.5px solid var(--ink);
}

.perm-no {
  background: transparent;
  color: var(--muted);
  border: 1.5px dashed var(--muted);
}

.profile-actions {
  margin-top: 1.5rem;
  text-align: right;
}
</style>