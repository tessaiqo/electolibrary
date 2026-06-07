import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth.js'
import { installShortcuts } from './composables/useShortcuts.js'
import './assets/styles.css'

const app = createApp(App)
app.use(router)

// При наличии валидного токена — догрузить данные в фоне
const { token, refreshUser } = useAuth()
if (token.value) {
  refreshUser()
}

// Регистрируем клавиатурные шорткаты глобально
installShortcuts(router)

app.mount('#app')