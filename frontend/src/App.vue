<template>
  <AppHeader />
  <main class="main">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter>
    <template #links>
      <RouterLink to="/">Главная</RouterLink> ·
      <RouterLink to="/books">Каталог</RouterLink> ·
      <a href="https://openlibrary.org" target="_blank">Open Library</a> ·
      <a href="#" @click.prevent="helpOpen = !helpOpen">шорткаты [?]</a>
    </template>
  </AppFooter>
  <ToastContainer />
  <ScrollToTop />
  <ShortcutsHelp />
</template>

<script>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import ToastContainer from './components/ToastContainer.vue'
import ScrollToTop from './components/ScrollToTop.vue'
import ShortcutsHelp from './components/ShortcutsHelp.vue'
import { useShortcuts } from './composables/useShortcuts.js'

export default {
  name: 'App',
  components: { AppHeader, AppFooter, ToastContainer, ScrollToTop, ShortcutsHelp },
  setup() {
    const { helpOpen } = useShortcuts()
    return { helpOpen }
  }
}
</script>