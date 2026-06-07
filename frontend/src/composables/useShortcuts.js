/**
 * Глобальные клавиатурные шорткаты приложения.
 * Регистрируются один раз на window. Не реагируют на ввод в input/textarea.
 *
 * Доступные комбинации:
 *   /          фокус на поле поиска (если оно есть)
 *   ?          показать справку
 *   g  →  h    Главная
 *   g  →  c    Каталог
 *   g  →  f    Избранное
 *   g  →  p    Профиль
 *   Esc        снять фокус с input / закрыть модалку справки
 */
import { ref } from 'vue'

const helpOpen = ref(false)
let installed = false
let lastGPressed = 0

function isEditableTarget(t) {
  if (!t) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}

function focusSearch() {
  const el = document.querySelector('.search-input')
                || document.querySelector('input[type="text"][placeholder*="поиск" i]')
                || document.querySelector('input[type="text"]')
  if (el) {
    el.focus()
    el.select?.()
  }
}

export function installShortcuts(router) {
  if (installed) return
  installed = true

  window.addEventListener('keydown', (e) => {
    // Esc работает всегда
    if (e.key === 'Escape') {
      if (helpOpen.value) {
        helpOpen.value = false
        return
      }
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur()
      }
      return
    }

    // Внутри input/textarea — не реагируем
    if (isEditableTarget(e.target)) return
    // Игнорируем сочетания с Cmd/Ctrl/Alt
    if (e.metaKey || e.ctrlKey || e.altKey) return

    if (e.key === '/') {
      e.preventDefault()
      focusSearch()
      return
    }

    if (e.key === '?') {
      e.preventDefault()
      helpOpen.value = !helpOpen.value
      return
    }

    // Двухклавишные g + ...
    const now = Date.now()
    if (e.key === 'g') {
      lastGPressed = now
      return
    }
    if (now - lastGPressed < 800) {
      const map = {
        h: '/',
        c: '/books',
        f: '/favorites',
        p: '/profile',
      }
      if (map[e.key]) {
        e.preventDefault()
        router.push(map[e.key])
        lastGPressed = 0
      }
    }
  })
}

export function useShortcuts() {
  return { helpOpen }
}