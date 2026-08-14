<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="layout">
    <AppHeader />
    <main class="main">
      <RouterView />
    </main>
    <footer class="footer">
      <p>Fancheer · 博主个人展示站</p>
    </footer>
  </div>
</template>
