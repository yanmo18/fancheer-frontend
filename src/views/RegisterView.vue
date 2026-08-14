<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as authApi from '@/api/auth'

const router = useRouter()

const username = ref('')
const password = ref('')
const captchaText = ref('')
const captchaId = ref('')
const captchaSvg = ref('')
const agreement = ref(false)
const loading = ref(false)
const error = ref('')

async function loadCaptcha() {
  const data = await authApi.getCaptcha()
  captchaId.value = data.captchaId
  captchaSvg.value = data.svg
}

onMounted(loadCaptcha)

async function submit() {
  error.value = ''
  if (!agreement.value) {
    error.value = '请勾选用户协议'
    return
  }
  loading.value = true
  try {
    await authApi.register({
      username: username.value,
      password: password.value,
      captchaId: captchaId.value,
      captchaText: captchaText.value,
      agreement: true,
    })
    router.push('/login')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '注册失败'
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="card auth-card" @submit.prevent="submit">
      <h1>注册</h1>
      <label>
        用户名
        <input v-model="username" required />
      </label>
      <label>
        密码
        <input v-model="password" type="password" required />
      </label>
      <div class="captcha-row">
        <label class="flex-1">
          验证码
          <input v-model="captchaText" required />
        </label>
        <div class="captcha-box" v-html="captchaSvg" @click="loadCaptcha" title="点击刷新" />
      </div>
      <label class="checkbox">
        <input v-model="agreement" type="checkbox" />
        我已阅读并同意用户协议
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? '提交中...' : '注册' }}
      </button>
      <p class="muted">
        已有账号？
        <RouterLink to="/login">去登录</RouterLink>
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

label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input[type='text'],
input[type='password'] {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

.captcha-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.flex-1 {
  flex: 1;
}

.captcha-box {
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  height: 40px;
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
</style>
