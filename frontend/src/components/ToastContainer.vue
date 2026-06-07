<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in items"
          :key="t.id"
          class="toast"
          :class="`toast--${t.type}`"
          role="alert"
          @click="remove(t.id)"
        >
          <span class="toast__icon">{{ iconFor(t.type) }}</span>
          <span class="toast__msg">{{ t.message }}</span>
          <button class="toast__close" aria-label="закрыть">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script>
import { useToast } from '@/composables/useToast.js'

export default {
  name: 'ToastContainer',
  setup() {
    const { items, remove } = useToast()
    return { items, remove }
  },
  methods: {
    iconFor(type) {
      return { success: '✓', error: '✕', warning: '!', info: 'i' }[type] || ''
    }
  }
}
</script>