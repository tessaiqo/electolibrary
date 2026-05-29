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
        meta: { title: 'Импорт из Open Library' }
      }
    ]
  },
  {
    path: '/books/new',
    name: 'book-new',
    component: () => import('@/views/BookFormView.vue'),
    meta: { title: 'Новая книга' }
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
    meta: { title: 'Редактирование' }
  },
  {
    path: '/books/:id',
    name: 'book-detail',
    component: () => import('@/views/BookDetailView.vue'),
    props: true,
    meta: { title: 'Книга' }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { title: 'Избранное' }
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
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · E-Library` : 'E-Library'
})

export default router