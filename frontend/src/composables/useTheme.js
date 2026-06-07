/**
 * Composable для переключения светлой/тёмной темы.
 * Тема применяется через атрибут data-theme на <html> и сохраняется в localStorage.
 * При первом визите берётся системное предпочтение пользователя (prefers-color-scheme).
 */
import { ref, watch } from 'vue'

const STORAGE_KEY = 'electolibrary:theme'

function getInitial() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  // системное предпочтение
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(getInitial())

// При изменении — применяем к <html> и сохраняем
watch(theme, (val) => {
  document.documentElement.setAttribute('data-theme', val)
  localStorage.setItem(STORAGE_KEY, val)
}, { immediate: true })

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  function set(value) {
    theme.value = value
  }
  return { theme, toggle, set }
}