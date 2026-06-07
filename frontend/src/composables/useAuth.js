import { reactive, computed } from 'vue'
import axios from 'axios'

const TOKEN_KEY = 'electolibrary:token'
const USER_KEY = 'electolibrary:user'

function loadInitial() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userRaw = localStorage.getItem(USER_KEY)
    const user = userRaw ? JSON.parse(userRaw) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

const state = reactive(loadInitial())

function save() {
  if (state.token) localStorage.setItem(TOKEN_KEY, state.token)
  else localStorage.removeItem(TOKEN_KEY)
  if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user))
  else localStorage.removeItem(USER_KEY)
}

export function useAuth() {
  const token = computed(() => state.token)
  const user = computed(() => state.user)
  const isAuthenticated = computed(() => !!state.token && !!state.user)
  const isAdmin = computed(() => !!state.user?.is_admin)

  async function login(email, password) {
    const { data } = await axios.post('/api/auth/login', { email, password })
    state.token = data.access_token
    state.user = data.user
    save()
    // Динамический импорт, чтобы избежать цикла
    const { useFavorites } = await import('./useFavorites.js')
    await useFavorites().onLogin()
    return data.user
  }

  async function register(email, password) {
    const { data } = await axios.post('/api/auth/register', { email, password })
    state.token = data.access_token
    state.user = data.user
    save()
    const { useFavorites } = await import('./useFavorites.js')
    await useFavorites().onLogin()
    return data.user
  }

  async function logout() {
    state.token = null
    state.user = null
    save()
    const { useFavorites } = await import('./useFavorites.js')
    useFavorites().onLogout()
  }

  async function refreshUser() {
    if (!state.token) return null
    try {
      const { data } = await axios.get('/api/auth/me')
      state.user = data
      save()
      // Подтянем серверное избранное
      const { useFavorites } = await import('./useFavorites.js')
      await useFavorites().syncWithServer()
      return data
    } catch {
      logout()
      return null
    }
  }

  return { token, user, isAuthenticated, isAdmin, login, register, logout, refreshUser }
}