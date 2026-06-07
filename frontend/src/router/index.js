import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Главная' }
  },
  {
    path: '/books',
    name: 'books',
    component: () => import('@/views/BooksView.vue'),
    meta: { title: 'Каталог' },
    children: [
      {
        path: 'import',
        name: 'books-import',
        component: () => import('@/views/ImportView.vue'),
        meta: { title: 'Импорт из Open Library', requiresAdmin: true }
      }
    ]
  },
  {
    path: '/books/new',
    name: 'book-new',
    component: () => import('@/views/BookFormView.vue'),
    meta: { title: 'Новая книга', requiresAdmin: true }
  },
  {
    path: '/books/:id',
    name: 'book-detail',
    component: () => import('@/views/BookDetailView.vue'),
    props: true,
    meta: { title: 'Книга' }
  },
  {
    path: '/books/:id/edit',
    name: 'book-edit',
    component: () => import('@/views/BookFormView.vue'),
    props: true,
    meta: { title: 'Редактирование', requiresAdmin: true }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { title: 'Избранное' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Вход' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Регистрация' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: 'Профиль', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

// Глобальный guard: защита маршрутов с requiresAuth / requiresAdmin
router.beforeEach((to, from, next) => {
  // Читаем user прямо из localStorage, чтобы не плодить циклические импорты
  const userRaw = localStorage.getItem('electolibrary:user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const isAuth = !!localStorage.getItem('electolibrary:token') && !!user
  const isAdmin = !!user?.is_admin

  if (to.meta.requiresAdmin && !isAdmin) {
    // Не админ — редирект на каталог
    return next({ name: 'books' })
  }
  if (to.meta.requiresAuth && !isAuth) {
    // Не авторизован — редирект на логин, запомним куда хотел
    return next({ name: 'login', query: { next: to.fullPath } })
  }
  next()
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · E-Library` : 'E-Library'
})

export default router