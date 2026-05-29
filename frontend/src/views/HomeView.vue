<template>
  <div class="hero">
    <div class="section-num">01 / Главная</div>
    <h1>
      Электронная<br>
      <span class="accent">Библиотека</span>
    </h1>
    <p class="lead">
      Учебный SPA-прототип на Vue 3 + FastAPI + SQLite.
      Хранение книг, фильтры, сортировка, импорт из Open Library.
    </p>
    <div class="hero-actions">
      <RouterLink to="/books" class="btn">Открыть каталог</RouterLink>
      <RouterLink to="/books/new" class="btn btn-ghost">Добавить книгу</RouterLink>
    </div>
  </div>
</template>

<script>
export default { name: 'HomeView' }
</script>