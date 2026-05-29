<template>
  <section class="layout-card">
    <!-- Именованный слот заголовка -->
    <header v-if="$slots.header" class="layout-card__header">
      <slot name="header" />
    </header>

    <!-- Слот по умолчанию -->
    <div class="layout-card__body">
      <slot />
    </div>

    <!-- Slot scope: передаём данные родителю -->
    <footer v-if="$slots.footer" class="layout-card__footer">
      <slot name="footer" :year="currentYear" :items="itemsCount" />
    </footer>
  </section>
</template>

<script>
export default {
  name: 'LayoutCard',
  props: {
    itemsCount: { type: Number, default: 0 }
  },
  computed: {
    currentYear() { return new Date().getFullYear() }
  }
}
</script>