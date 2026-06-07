<template>
  <div class="empty-state">
    <div class="empty-state__art">
      <!-- Слот для кастомной иллюстрации -->
      <slot name="art">
        <!-- Дефолт — пустая открытая книга -->
        <svg viewBox="0 0 200 160" width="200" height="160" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 30 L20 130 L100 110 L180 130 L180 30 L100 50 Z" fill="var(--paper)"/>
          <line x1="100" y1="50" x2="100" y2="110"/>
          <line x1="35" y1="60" x2="80" y2="55"/>
          <line x1="35" y1="75" x2="80" y2="70"/>
          <line x1="35" y1="90" x2="75" y2="85"/>
          <line x1="120" y1="55" x2="165" y2="60"/>
          <line x1="120" y1="70" x2="165" y2="75"/>
          <line x1="125" y1="85" x2="160" y2="90"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-state__title">
      <slot name="title">Пусто</slot>
    </h3>
    <p class="empty-state__msg">
      <slot />
    </p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script>
export default { name: 'EmptyState' }
</script>