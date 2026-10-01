<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import * as publicApi from '@/api/public'
import { resolveAvatarUrl } from '@/utils/avatar'
import { resolveMediaUrl } from '@/utils/mediaUrl'

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
  resolveMediaUrl(resolveAvatarUrl(auth.user?.avatar, auth.user?.avatarUrl))
</script>

<template>
  <nav class="top-nav">
    <RouterLink to="/" class="nav-brand" @click="closeMenu">
      <span class="nav-logo-text">{{ siteName }}</span>
      <span class="nav-logo-sub">{{ siteSub }}</span>
    </RouterLink>

    <button
      type="button"
      class="nav-mobile-toggle"
      aria-label="菜单"
      :aria-expanded="menuOpen"
      aria-controls="primary-nav"
      @click="menuOpen = !menuOpen"
    >
      {{ menuOpen ? '✕' : '☰' }}
    </button>

    <!-- 桌面：链接与右侧操作仍分两块 -->
    <div id="primary-nav" class="nav-links desktop-only">
      <RouterLink to="/" class="nav-link" :class="{ active: navActive('/') && route.path === '/' }">
        首页
      </RouterLink>
      <RouterLink to="/activities" class="nav-link" :class="{ active: navActive('/activities') }">
        活动日历
      </RouterLink>
      <RouterLink
        v-if="auth.isLoggedIn"
        to="/messages"
        class="nav-link"
        :class="{ active: navActive('/messages') }"
      >
        聊天室
      </RouterLink>
      <RouterLink
        v-if="auth.isLoggedIn"
        to="/checkin"
        class="nav-link"
        :class="{ active: navActive('/checkin') }"
      >
        每日打卡
      </RouterLink>
      <RouterLink
        v-if="auth.isLoggedIn"
        to="/profile"
        class="nav-link"
        :class="{ active: navActive('/profile') }"
      >
        个人中心
      </RouterLink>
      <RouterLink v-if="auth.isAdmin" to="/admin" class="nav-link" :class="{ active: navActive('/admin') }">
        管理
      </RouterLink>
    </div>

    <div class="nav-right desktop-only">
      <button type="button" class="theme-toggle" :aria-label="themeLabel" @click="toggleTheme">
        <span class="theme-toggle-icon">{{ themeIcon }}</span>
        <span>{{ themeLabel }}</span>
      </button>

      <template v-if="auth.isLoggedIn">
        <RouterLink to="/profile" class="nav-avatar nav-avatar-link">
          <img v-if="navAvatarUrl()" :src="navAvatarUrl()" alt="" class="nav-avatar-img" />
          <span v-else>{{ (auth.user?.nickname || auth.user?.username || '?').slice(0, 1).toUpperCase() }}</span>
        </RouterLink>
        <button type="button" class="btn btn-ghost btn-sm nav-logout" @click="handleLogout">退出</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="btn btn-ghost btn-sm">登录</RouterLink>
        <RouterLink to="/register" class="btn btn-primary btn-sm">注册</RouterLink>
      </template>
    </div>

    <!-- 移动端：单一面板，游客/登录用户都不会在中间留缝 -->
    <div class="nav-mobile-panel" :class="{ open: menuOpen }" id="mobile-nav">
      <div class="nav-mobile-links">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ active: navActive('/') && route.path === '/' }"
          @click="closeMenu"
        >
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
        <RouterLink
          v-if="auth.isAdmin"
          to="/admin"
          class="nav-link"
          :class="{ active: navActive('/admin') }"
          @click="closeMenu"
        >
          管理
        </RouterLink>
      </div>

      <div class="nav-mobile-actions">
        <button type="button" class="theme-toggle" :aria-label="themeLabel" @click="toggleTheme">
          <span class="theme-toggle-icon">{{ themeIcon }}</span>
          <span>{{ themeLabel }}</span>
        </button>

        <template v-if="auth.isLoggedIn">
          <RouterLink to="/profile" class="nav-avatar nav-avatar-link" @click="closeMenu">
            <img v-if="navAvatarUrl()" :src="navAvatarUrl()" alt="" class="nav-avatar-img" />
            <span v-else>{{ (auth.user?.nickname || auth.user?.username || '?').slice(0, 1).toUpperCase() }}</span>
          </RouterLink>
          <button type="button" class="btn btn-ghost btn-sm nav-logout" @click="handleLogout">退出</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-ghost btn-sm" @click="closeMenu">登录</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm" @click="closeMenu">注册</RouterLink>
        </template>
      </div>
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

.nav-mobile-panel {
  display: none;
}

@media (max-width: 900px) {
  .nav-mobile-toggle {
    display: grid;
    place-items: center;
  }

  .desktop-only {
    display: none !important;
  }

  .nav-mobile-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: fixed;
    left: 0;
    right: 0;
    top: 60px;
    background: var(--nav-bg);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0.75rem 1rem 1rem;
    transform: translateY(-120%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.2s, opacity 0.2s;
    z-index: 101;
    max-height: calc(100vh - 60px);
    overflow-y: auto;
  }

  .nav-mobile-panel.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-mobile-links {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-mobile-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-subtle);
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
