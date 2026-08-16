<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="layout">
    <AppHeader />
    <div class="main-content">
      <RouterView />
    </div>
    <footer class="site-footer">
      <p>Fancheer · 博主个人展示站</p>
      <p class="site-footer-links">
        <RouterLink to="/terms">用户协议</RouterLink>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}

.site-footer {
  padding: 2rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8125rem;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.site-footer p {
  margin: 0;
}

.site-footer-links {
  margin-top: 0.5rem;
}

.site-footer-links a {
  color: var(--text-muted);
  text-decoration: none;
}

.site-footer-links a:hover {
  color: var(--accent-primary);
}
</style>
