<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { safeRedirect } from '@/utils/safeRedirect'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <div class="auth-brand">
        <div class="auth-brand-name">欢迎回来</div>
        <div class="auth-brand-desc">登录后可留言、打卡与互动</div>
      </div>

      <div class="auth-field">
        <label class="auth-label">用户名</label>
        <input v-model="username" class="auth-input" required autocomplete="username" />
      </div>
      <div class="auth-field">
        <label class="auth-label">密码</label>
        <input
          v-model="password"
          class="auth-input"
          type="password"
          required
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="auth-submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <p class="auth-footer">
        还没有账号？
        <RouterLink to="/register">去注册</RouterLink>
      </p>
    </form>
  </div>
</template>
