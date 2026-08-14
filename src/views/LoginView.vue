<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="card auth-card" @submit.prevent="submit">
      <h1>登录</h1>
      <p class="muted">注册访客登录后可留言、打卡</p>
      <label>
        用户名
        <input v-model="username" required autocomplete="username" />
      </label>
      <label>
        密码
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <p class="muted">
        还没有账号？
        <RouterLink to="/register">去注册</RouterLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 120px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.auth-card h1 {
  margin: 0;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}
</style>
