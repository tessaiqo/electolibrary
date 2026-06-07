<template>
  <div class="auth-page">
    <LayoutCard>
      <template #header>Вход</template>

      <form class="book-form" @submit.prevent="onSubmit">
        <div class="form-group">
          <label>Email <span class="req">*</span></label>
          <input
            v-model.trim="email"
            type="email"
            autocomplete="email"
            :class="{ 'is-error': errors.email }"
          />
          <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
        </div>

        <div class="form-group">
          <label>Пароль <span class="req">*</span></label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            :class="{ 'is-error': errors.password }"
          />
          <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
        </div>

        <p v-if="submitError" class="form-error form-error--big">{{ submitError }}</p>

        <div class="form-actions">
          <button type="submit" class="btn" :disabled="submitting">
            {{ submitting ? '...' : 'Войти' }}
          </button>
          <RouterLink to="/register" class="btn btn-ghost">Регистрация</RouterLink>
        </div>

        <p class="form-hint" style="margin-top: 1rem;">
          // нет аккаунта? создайте новый — займёт 10 секунд
        </p>
      </form>
    </LayoutCard>
  </div>
</template>

<script>
import LayoutCard from '@/components/LayoutCard.vue'
import { useAuth } from '@/composables/useAuth.js'

export default {
  name: 'LoginView',
  components: { LayoutCard },
  setup() {
    const { login } = useAuth()
    return { login }
  },
  data() {
    return {
      email: '',
      password: '',
      errors: {},
      submitting: false,
      submitError: ''
    }
  },
  methods: {
    validate() {
      const e = {}
      if (!this.email) e.email = 'Введите email'
      if (!this.password) e.password = 'Введите пароль'
      this.errors = e
      return Object.keys(e).length === 0
    },
    async onSubmit() {
      this.submitError = ''
      if (!this.validate()) return
      this.submitting = true
      try {
        await this.login(this.email, this.password)
        // редирект на ту страницу, с которой пришли (или на главную)
        const next = this.$route.query.next || '/'
        this.$router.push(next)
      } catch (e) {
        this.submitError = e.response?.data?.detail || 'Не удалось войти'
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 480px;
  margin: 2rem auto;
}
</style>