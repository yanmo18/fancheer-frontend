<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

const navGroups = [
  {
    label: '概览',
    items: [{ to: '/admin', icon: '📊', label: '管理首页' }],
  },
  {
    label: '站点',
    items: [{ to: '/admin/streamer', icon: '🏠', label: '博主资料' }],
  },
  {
    label: '素材',
    items: [
      { to: '/admin/banners', icon: '🖼', label: 'Banner' },
      { to: '/admin/gallery', icon: '🎨', label: '图集' },
      { to: '/admin/avatars', icon: '👤', label: '预设头像' },
      { to: '/admin/graph', icon: '🕸', label: '关系图谱' },
    ],
  },
  {
    label: '内容',
    items: [
      { to: '/admin/songs', icon: '🎵', label: '音乐' },
      { to: '/admin/activities', icon: '📅', label: '活动' },
      { to: '/admin/awards', icon: '🏆', label: '荣誉' },
    ],
  },
  {
    label: '社区',
    items: [
      { to: '/admin/messages', icon: '💬', label: '留言与举报' },
      { to: '/admin/sensitive-words', icon: '🛡', label: '敏感词' },
    ],
  },
  {
    label: '系统',
    items: [
      { to: '/admin/users', icon: '👥', label: '用户管理' },
      { to: '/admin/logs', icon: '📋', label: '操作日志' },
    ],
  },
]
</script>

<template>
  <div class="admin-shell">
    <AppHeader />

    <button type="button" class="admin-mobile-toggle" @click="sidebarOpen = !sidebarOpen">
      {{ sidebarOpen ? '✕' : '☰' }} 管理菜单
    </button>

    <div class="admin-page">
      <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
        <p class="admin-sidebar-user muted">{{ auth.user?.nickname }}</p>

        <template v-for="group in navGroups" :key="group.label">
          <div class="admin-sidebar-label">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="admin-nav-item"
            :class="{ active: isActive(item.to) }"
            @click="closeSidebar"
          >
            <span class="admin-nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </template>

        <div class="admin-sidebar-label">返回</div>
        <RouterLink to="/" class="admin-nav-item" @click="closeSidebar">
          <span class="admin-nav-icon">↩</span>
          <span>前台站点</span>
        </RouterLink>
      </aside>

      <div v-if="sidebarOpen" class="admin-backdrop" @click="closeSidebar" />

      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background: var(--bg-primary);
}

.admin-sidebar-user {
  padding: 0 20px 12px;
  margin: 0;
  font-size: 12px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 8px;
}

.admin-mobile-toggle {
  display: none;
  margin: 0;
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font: inherit;
  position: sticky;
  top: 60px;
  z-index: 11;
}

.admin-backdrop {
  display: none;
}

@media (max-width: 900px) {
  .admin-mobile-toggle {
    display: block;
  }

  .admin-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    top: 60px;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9;
  }
}
</style>
