<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import * as publicApi from '@/api/public'
import { resolveAvatarUrl } from '@/utils/avatar'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const menuOpen = ref(false)
const siteName = ref('Fancheer')
const siteSub = ref('博主个人展示站')

const { themeIcon, themeLabel, toggleTheme } = useTheme()

onMounted(async () => {
  try {
    const info = await publicApi.getStreamerInfo()
    if (info.name) siteName.value = info.name
    if (info.tags?.length) {
      const tags = Array.isArray(info.tags) ? info.tags : [info.tags]
      siteSub.value = tags.slice(0, 2).join(' · ')
    }
  } catch {
    /* keep defaults */
  }
})

async function handleLogout() {
  menuOpen.value = false
  await auth.logout()
  router.push('/')
}

function closeMenu() {
  menuOpen.value = false
}

function navActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const navAvatarUrl = () =>
  resolveAvatarUrl(auth.user?.avatar, auth.user?.avatarUrl)
</script>

<template>
  <nav class="top-nav">
    <RouterLink to="/" class="nav-brand" @click="closeMenu">
      <span class="nav-logo-text">{{ siteName }}</span>
      <span class="nav-logo-sub">{{ siteSub }}</span>
    </RouterLink>

    <button type="button" class="nav-mobile-toggle" aria-label="菜单" @click="menuOpen = !menuOpen">
      {{ menuOpen ? '✕' : '☰' }}
    </button>

    <div class="nav-links" :class="{ open: menuOpen }">
      <RouterLink to="/" class="nav-link" :class="{ active: navActive('/') && route.path === '/' }" @click="closeMenu">
        首页
      </RouterLink>
      <RouterLink
        to="/activities"
        class="nav-link"
        :class="{ active: navActive('/activities') }"
        @click="closeMenu"
      >
        活动日历
      </RouterLink>
      <RouterLink
        v-if="auth.isLoggedIn"
        to="/messages"
        class="nav-link"
        :class="{ active: navActive('/messages') }"
        @click="closeMenu"
      >
        聊天室
      </RouterLink>
      <RouterLink
        v-if="auth.isLoggedIn"
        to="/checkin"
        class="nav-link"
        :class="{ active: navActive('/checkin') }"
        @click="closeMenu"
      >
        每日打卡
      </RouterLink>
      <RouterLink
        v-if="auth.isLoggedIn"
        to="/profile"
        class="nav-link"
        :class="{ active: navActive('/profile') }"
        @click="closeMenu"
      >
        个人中心
      </RouterLink>
      <RouterLink v-if="auth.isAdmin" to="/admin" class="nav-link" :class="{ active: navActive('/admin') }" @click="closeMenu">
        管理
      </RouterLink>
    </div>

    <div class="nav-right" :class="{ open: menuOpen }">
      <button type="button" class="theme-toggle" :aria-label="themeLabel" @click="toggleTheme">
        <span class="theme-toggle-icon">{{ themeIcon }}</span>
        <span>{{ themeLabel }}</span>
      </button>

      <template v-if="auth.isLoggedIn">
        <RouterLink to="/profile" class="nav-avatar nav-avatar-link" @click="closeMenu">
          <img
            v-if="navAvatarUrl()"
            :src="navAvatarUrl()"
            alt=""
            class="nav-avatar-img"
          />
          <span v-else>{{ (auth.user?.nickname || auth.user?.username || '?').slice(0, 1).toUpperCase() }}</span>
        </RouterLink>
        <button type="button" class="btn btn-ghost btn-sm nav-logout" @click="handleLogout">退出</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="btn btn-ghost btn-sm" @click="closeMenu">登录</RouterLink>
        <RouterLink to="/register" class="btn btn-primary btn-sm" @click="closeMenu">注册</RouterLink>
      </template>
    </div>

    <div v-if="menuOpen" class="nav-backdrop" @click="closeMenu" />
  </nav>
</template>

<style scoped>
.nav-brand {
  text-decoration: none;
  color: inherit;
}

.nav-mobile-toggle {
  display: none;
  margin-left: auto;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  z-index: 102;
}

.nav-avatar-link {
  text-decoration: none;
  overflow: hidden;
}

.nav-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.nav-logout {
  white-space: nowrap;
}

.nav-backdrop {
  display: none;
}

@media (max-width: 900px) {
  .nav-mobile-toggle {
    display: grid;
    place-items: center;
  }

  .nav-links,
  .nav-right {
    position: fixed;
    left: 0;
    right: 0;
    background: var(--nav-bg);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    transform: translateY(-120%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.2s, opacity 0.2s;
    z-index: 101;
  }

  .nav-links {
    top: 60px;
  }

  .nav-right {
    top: calc(60px + 13.5rem);
    flex-direction: row;
    flex-wrap: wrap;
    border-top: none;
  }

  .nav-links.open,
  .nav-right.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-link {
    text-align: left;
  }

  .nav-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    top: 60px;
    background: rgba(0, 0, 0, 0.35);
    z-index: 99;
  }
}
</style>
