<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

async function handleLogout() {
  menuOpen.value = false
  await auth.logout()
  router.push('/')
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="logo" @click="closeMenu">Fancheer</RouterLink>

    <button
      type="button"
      class="menu-btn"
      aria-label="打开菜单"
      @click="menuOpen = !menuOpen"
    >
      {{ menuOpen ? '✕' : '☰' }}
    </button>

    <nav class="nav" :class="{ open: menuOpen }">
      <RouterLink to="/" @click="closeMenu">首页</RouterLink>
      <RouterLink to="/messages" @click="closeMenu">留言</RouterLink>
      <RouterLink v-if="auth.isLoggedIn" to="/profile" @click="closeMenu">我的</RouterLink>
      <RouterLink v-if="auth.isLoggedIn" to="/checkin" @click="closeMenu">打卡</RouterLink>
      <RouterLink v-if="auth.isAdmin" to="/admin" @click="closeMenu">管理</RouterLink>
    </nav>

    <div class="auth-actions" :class="{ open: menuOpen }">
      <template v-if="auth.isLoggedIn">
        <img
          v-if="auth.user?.avatar || auth.user?.avatarUrl"
          :src="auth.user.avatar || auth.user.avatarUrl"
          alt=""
          class="user-avatar"
        />
        <span class="user-tag">{{ auth.user?.nickname || auth.user?.username }}</span>
        <button type="button" class="btn btn-ghost" @click="handleLogout">退出</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="btn btn-ghost" @click="closeMenu">登录</RouterLink>
        <RouterLink to="/register" class="btn btn-primary" @click="closeMenu">注册</RouterLink>
      </template>
    </div>

    <div v-if="menuOpen" class="backdrop" @click="closeMenu" />
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 20;
}

.logo {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--primary);
  text-decoration: none;
  z-index: 22;
}

.menu-btn {
  display: none;
  margin-left: auto;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
  font-size: 1rem;
  z-index: 22;
}

.nav {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.nav a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9375rem;
}

.nav a.router-link-active {
  color: var(--text);
  font-weight: 600;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.user-tag {
  font-size: 0.875rem;
  color: var(--text-muted);
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backdrop {
  display: none;
}

@media (max-width: 768px) {
  .menu-btn {
    display: grid;
    place-items: center;
  }

  .nav,
  .auth-actions {
    position: fixed;
    left: 0;
    right: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    transform: translateY(-120%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.2s, opacity 0.2s;
    z-index: 21;
  }

  .nav {
    top: 57px;
  }

  .auth-actions {
    top: calc(57px + 9.5rem);
    border-top: none;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .nav.open,
  .auth-actions.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav a {
    padding: 0.625rem 0.25rem;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    z-index: 19;
  }
}
</style>
