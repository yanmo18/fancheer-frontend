<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'

const accessDenied = ref('')

onMounted(() => {
  const msg = sessionStorage.getItem('access_denied_msg')
  if (msg) {
    accessDenied.value = msg
    sessionStorage.removeItem('access_denied_msg')
  }
})
</script>

<template>
  <div class="layout">
    <AppHeader />
    <p v-if="accessDenied" class="access-denied">{{ accessDenied }}</p>
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

.access-denied {
  margin: 0;
  padding: 0.75rem 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--accent-warm, #c45c26);
  background: rgba(196, 92, 38, 0.08);
  border-bottom: 1px solid var(--border-subtle);
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
