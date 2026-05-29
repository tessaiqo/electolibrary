<template>
  <AppHeader />
  <main class="main">
    <RouterView />
  </main>
  <AppFooter>
    <template #links>
      <RouterLink to="/">Главная</RouterLink> ·
      <RouterLink to="/books">Каталог</RouterLink> ·
      <a href="https://openlibrary.org" target="_blank">Open Library</a>
    </template>
  </AppFooter>
</template>

<script>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

export default {
  name: 'App',
  components: { AppHeader, AppFooter }
}
</script>