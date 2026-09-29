<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { safeRedirect } from '@/utils/safeRedirect'
import PasswordInput from '@/components/PasswordInput.vue'
import { useCooldown } from '@/composables/useCooldown'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const cooldown = useCooldown()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const notice = ref('')

onMounted(() => {
  if (String(route.query.registered) === '1') {
    notice.value = '注册成功，请登录'
  }
})

async function submit() {
  if (cooldown.left > 0) return
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
    cooldown.startFromError(e, 60_000)
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
      <PasswordInput
        v-model="password"
        label="密码"
        autocomplete="current-password"
        required
      />

      <p v-if="notice" class="success">{{ notice }}</p>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="auth-submit" :disabled="loading || cooldown.left > 0">
        {{ loading ? '登录中...' : cooldown.left > 0 ? `请 ${cooldown.left} 秒后再试` : '登录' }}
      </button>
      <p class="auth-footer">
        还没有账号？
        <RouterLink to="/register">去注册</RouterLink>
      </p>
    </form>
  </div>
</template>
