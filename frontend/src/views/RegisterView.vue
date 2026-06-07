<template>
  <div class="auth-page">
    <LayoutCard>
      <template #header>Регистрация</template>

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
            autocomplete="new-password"
            :class="{ 'is-error': errors.password }"
          />
          <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
          <p class="form-hint">минимум 6 символов</p>
        </div>

        <div class="form-group">
          <label>Повторите пароль <span class="req">*</span></label>
          <input
            v-model="password2"
            type="password"
            autocomplete="new-password"
            :class="{ 'is-error': errors.password2 }"
          />
          <p v-if="errors.password2" class="form-error">{{ errors.password2 }}</p>
        </div>

        <p v-if="submitError" class="form-error form-error--big">{{ submitError }}</p>

        <div class="form-actions">
          <button type="submit" class="btn" :disabled="submitting">
            {{ submitting ? '...' : 'Создать аккаунт' }}
          </button>
          <RouterLink to="/login" class="btn btn-ghost">У меня уже есть аккаунт</RouterLink>
        </div>
      </form>
    </LayoutCard>
  </div>
</template>

<script>
import LayoutCard from '@/components/LayoutCard.vue'
import { useAuth } from '@/composables/useAuth.js'

export default {
  name: 'RegisterView',
  components: { LayoutCard },
  setup() {
    const { register } = useAuth()
    return { register }
  },
  data() {
    return {
      email: '',
      password: '',
      password2: '',
      errors: {},
      submitting: false,
      submitError: ''
    }
  },
  methods: {
    validate() {
      const e = {}
      if (!this.email || !this.email.includes('@')) e.email = 'Введите корректный email'
      if (!this.password || this.password.length < 6) e.password = 'Минимум 6 символов'
      if (this.password !== this.password2) e.password2 = 'Пароли не совпадают'
      this.errors = e
      return Object.keys(e).length === 0
    },
    async onSubmit() {
      this.submitError = ''
      if (!this.validate()) return
      this.submitting = true
      try {
        await this.register(this.email, this.password)
        this.$router.push('/')
      } catch (e) {
        this.submitError = e.response?.data?.detail || 'Не удалось зарегистрироваться'
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