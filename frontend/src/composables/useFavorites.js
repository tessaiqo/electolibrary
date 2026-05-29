/**
 * Composable для работы с избранным.
 * Хранит ID книг в localStorage, использует reactive-Set,
 * чтобы все компоненты автоматически обновлялись при изменениях.
 */
import { reactive, computed } from 'vue'

const STORAGE_KEY = 'electolibrary:favorites'

// Один общий reactive-Set на всё приложение
const state = reactive({
  ids: new Set(loadFromStorage())
})

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

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.ids]))
}

export function useFavorites() {
  const favoriteIds = computed(() => state.ids)
  const count = computed(() => state.ids.size)

  function isFavorite(id) {
    return state.ids.has(Number(id))
  }

  function add(id) {
    state.ids.add(Number(id))
    saveToStorage()
  }

  function remove(id) {
    state.ids.delete(Number(id))
    saveToStorage()
  }

  function toggle(id) {
    if (isFavorite(id)) remove(id)
    else add(id)
  }

  // Чистка ID, которых больше нет в БД (книгу удалили — id висит в localStorage)
  function syncWith(existingIds) {
    const valid = new Set(existingIds.map(Number))
    let changed = false
    for (const id of state.ids) {
      if (!valid.has(id)) {
        state.ids.delete(id)
        changed = true
      }
    }
    if (changed) saveToStorage()
  }

  return { favoriteIds, count, isFavorite, add, remove, toggle, syncWith }
}