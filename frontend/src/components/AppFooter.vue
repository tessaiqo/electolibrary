<template>
  <footer class="footer">
    <div>© 2026 · E-Library</div>
    <div>
      <slot name="links">
        vue 3 · vite · fastapi · sqlite
      </slot>
    </div>
  </footer>
</template>

<script>
export default { name: 'AppFooter' }
</script>