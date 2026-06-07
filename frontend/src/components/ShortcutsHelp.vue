<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="helpOpen" class="modal-overlay" @click.self="helpOpen = false">
        <div class="modal-window" role="dialog" aria-label="клавиатурные шорткаты">
          <header class="modal-window__head">
            <h3>Клавиатурные шорткаты</h3>
            <button class="modal-close" @click="helpOpen = false" aria-label="закрыть">×</button>
          </header>

          <ul class="kb-list">
            <li><kbd>/</kbd> <span>фокус на строке поиска</span></li>
            <li><kbd>?</kbd> <span>показать/скрыть эту справку</span></li>
            <li><kbd>Esc</kbd> <span>снять фокус / закрыть окно</span></li>
            <li class="kb-divider">— навигация —</li>
            <li><kbd>G</kbd> <kbd>H</kbd> <span>на главную</span></li>
            <li><kbd>G</kbd> <kbd>C</kbd> <span>каталог</span></li>
            <li><kbd>G</kbd> <kbd>F</kbd> <span>избранное</span></li>
            <li><kbd>G</kbd> <kbd>P</kbd> <span>профиль</span></li>
          </ul>

          <p class="form-hint" style="margin-top: 1rem;">
            // двухклавишные сочетания: сначала G, потом следующая клавиша
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { useShortcuts } from '@/composables/useShortcuts.js'

export default {
  name: 'ShortcutsHelp',
  setup() {
    const { helpOpen } = useShortcuts()
    return { helpOpen }
  }
}
</script>