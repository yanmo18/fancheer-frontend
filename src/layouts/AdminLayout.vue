<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const sidebarOpen = ref(false)
</script>

<template>
  <div class="admin-layout">
    <header class="mobile-bar">
      <button type="button" class="menu-btn" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '✕' : '☰' }} 菜单
      </button>
      <strong>管理后台</strong>
      <span class="hint">{{ auth.user?.nickname }}</span>
    </header>

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <h2 class="desktop-title">管理后台</h2>
      <p class="hint desktop-hint">{{ auth.user?.nickname }}</p>
      <nav @click="sidebarOpen = false">
        <RouterLink to="/admin">概览</RouterLink>
        <RouterLink to="/admin/streamer">博主资料</RouterLink>
        <RouterLink to="/admin/banners">Banner</RouterLink>
        <RouterLink to="/admin/songs">音乐</RouterLink>
        <RouterLink to="/admin/activities">活动</RouterLink>
        <RouterLink to="/admin/gallery">图集</RouterLink>
        <RouterLink to="/admin/awards">荣誉</RouterLink>
        <RouterLink to="/admin/graph">关系图谱</RouterLink>
        <RouterLink to="/admin/users">用户</RouterLink>
        <RouterLink to="/admin/messages">留言</RouterLink>
        <RouterLink to="/admin/sensitive-words">敏感词</RouterLink>
        <RouterLink to="/admin/avatars">预设头像</RouterLink>
        <RouterLink to="/admin/logs">操作日志</RouterLink>
        <RouterLink to="/">返回站点</RouterLink>
      </nav>
    </aside>

    <div v-if="sidebarOpen" class="backdrop" @click="sidebarOpen = false" />

    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.mobile-bar {
  display: none;
}

.sidebar {
  background: #1e1e2e;
  color: #fff;
  padding: 1.5rem 1rem;
  z-index: 30;
}

.sidebar h2 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
}

.hint {
  margin: 0 0 1.5rem;
  font-size: 0.8125rem;
  opacity: 0.7;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar a {
  color: #cdd6f4;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9375rem;
}

.sidebar a.router-link-active {
  background: rgba(255, 255, 255, 0.1);
}

.admin-main {
  padding: 1.5rem;
  background: var(--bg);
  min-width: 0;
}

.backdrop {
  display: none;
}

@media (max-width: 900px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .mobile-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #1e1e2e;
    color: #fff;
    position: sticky;
    top: 0;
    z-index: 25;
  }

  .mobile-bar .hint {
    margin: 0 0 0 auto;
    font-size: 0.8125rem;
    opacity: 0.75;
  }

  .menu-btn {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: #fff;
    border-radius: 8px;
    padding: 0.375rem 0.625rem;
    cursor: pointer;
    font: inherit;
    font-size: 0.875rem;
  }

  .desktop-title,
  .desktop-hint {
    display: none;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(80vw, 260px);
    transform: translateX(-100%);
    transition: transform 0.2s;
    overflow-y: auto;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar .hint {
    display: none;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 29;
  }

  .admin-main {
    padding: 1rem;
  }
}
</style>
