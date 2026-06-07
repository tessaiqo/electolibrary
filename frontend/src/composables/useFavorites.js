/**
 * Composable для избранного с гибридной логикой:
 * - Гость:        хранение в localStorage этого браузера.
 * - Авторизован:  хранение в БД через API (/api/favorites).
 * - При логине:   merge localStorage → сервер, серверный список становится истиной.
 * - При логауте:  локальное состояние очищается (избранное юзера остаётся на сервере).
 */
import { reactive, computed } from 'vue'
import { favService } from '@/services/api.js'

const STORAGE_KEY = 'electolibrary:favorites'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.map(Number).filter(Number.isFinite) : []
  } catch {
    return []
  }
}

function saveToStorage(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

// Один общий reactive-Set на всё приложение
const state = reactive({
  ids: new Set(loadFromStorage()),
  authed: false,   // флаг, что сейчас режим авторизованного юзера
})


export function useFavorites() {
  const favoriteIds = computed(() => state.ids)
  const count = computed(() => state.ids.size)

  function isFavorite(id) {
    return state.ids.has(Number(id))
  }

  /** Внутренний хелпер — оптимистично обновляем state, потом синхронизируем */
  async function _toggleOnServer(id, action) {
    const numId = Number(id)
    if (action === 'add') state.ids.add(numId)
    else state.ids.delete(numId)

    try {
      if (action === 'add') {
        const { data } = await favService.add(numId)
        state.ids = new Set(data.ids)
      } else {
        await favService.remove(numId)
      }
    } catch (e) {
      // Откат при ошибке
      if (action === 'add') state.ids.delete(numId)
      else state.ids.add(numId)
      throw e
    }
  }

  async function add(id) {
    if (state.authed) {
      await _toggleOnServer(id, 'add')
    } else {
      state.ids.add(Number(id))
      saveToStorage(state.ids)
    }
  }

  async function remove(id) {
    if (state.authed) {
      await _toggleOnServer(id, 'remove')
    } else {
      state.ids.delete(Number(id))
      saveToStorage(state.ids)
    }
  }

  async function toggle(id) {
    if (isFavorite(id)) await remove(id)
    else await add(id)
  }

  /**
   * Вызывается при логине: локальное избранное (если есть) отправляется
   * на сервер через /merge, серверный список становится источником правды.
   */
  async function onLogin() {
    state.authed = true
    const localIds = [...state.ids]
    try {
      const { data } = await favService.merge(localIds)
      state.ids = new Set(data.ids)
      // Локальный кэш больше не нужен — он у авторизованных хранится на сервере
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Если что-то пошло не так — хотя бы попробуем загрузить с сервера
      try {
        const { data } = await favService.getIds()
        state.ids = new Set(data.ids)
      } catch {
        // оставляем как есть
      }
    }
  }

  /**
   * Вызывается при логауте: очищаем локальное состояние,
   * чтобы гость не видел сердечки залогиненного юзера.
   */
  function onLogout() {
    state.authed = false
    state.ids = new Set()
    // НЕ сохраняем в localStorage — у гостя пустой старт
  }

  /**
   * Вызывается при инициализации приложения, если пользователь уже
   * залогинен (есть валидный токен).
   */
  async function syncWithServer() {
    state.authed = true
    try {
      const { data } = await favService.getIds()
      state.ids = new Set(data.ids)
    } catch {
      // токен невалиден или сеть упала — пусть будет пусто
    }
  }

  /** Старый метод для совместимости с BookList компонентами */
  function syncWith(existingIds) {
    if (state.authed) return  // у авторизованных синк делает сервер через каскад
    const valid = new Set(existingIds.map(Number))
    let changed = false
    for (const id of state.ids) {
      if (!valid.has(id)) {
        state.ids.delete(id)
        changed = true
      }
    }
    if (changed) saveToStorage(state.ids)
  }

  return {
    favoriteIds, count, isFavorite,
    add, remove, toggle,
    onLogin, onLogout, syncWithServer, syncWith,
  }
}