/**
 * Система toast-уведомлений. Глобальный reactive-массив,
 * один общий для всего приложения.
 *
 * Использование:
 *   const toast = useToast()
 *   toast.success('Книга добавлена')
 *   toast.error('Ошибка сохранения')
 *   toast.info('Загрузка началась')
 */
import { reactive } from 'vue'

const state = reactive({
  items: []   // [{ id, type, message, timeout }]
})

let nextId = 1

function push(type, message, opts = {}) {
  const id = nextId++
  const timeout = opts.timeout ?? 3500
  state.items.push({ id, type, message })
  if (timeout > 0) {
    setTimeout(() => remove(id), timeout)
  }
  return id
}

function remove(id) {
  const i = state.items.findIndex(t => t.id === id)
  if (i !== -1) state.items.splice(i, 1)
}

export function useToast() {
  return {
    items: state.items,
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error', msg, opts),
    info:    (msg, opts) => push('info', msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
    remove,
  }
}