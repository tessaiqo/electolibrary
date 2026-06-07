<template>
  <div class="book-card book-card--skeleton">
    <div class="card-top">
      <span class="skel-line skel-line--xs" style="width: 80px"></span>
      <span class="skel-circle" style="width: 22px; height: 22px;"></span>
    </div>
    <div class="skel-block book-cover"></div>
    <span class="skel-line" style="width: 90%; height: 14px; margin-top: 8px;"></span>
    <span class="skel-line" style="width: 60%; height: 14px; margin-top: 6px;"></span>
    <span class="skel-line skel-line--xs" style="width: 50%; margin-top: 10px;"></span>
  </div>
</template>

<script>
export default { name: 'BookCardSkeleton' }
</script>