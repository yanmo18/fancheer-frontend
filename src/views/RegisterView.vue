<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as authApi from '@/api/auth'
import { isSameAvatarId, normalizeAvatarId } from '@/utils/avatar'

const router = useRouter()

const username = ref('')
const password = ref('')
const captchaText = ref('')
const captchaId = ref('')
const captchaSvg = ref('')
const agreement = ref(false)
const avatars = ref<Array<{ id: string; url: string }>>([])
const selectedAvatarId = ref('')
const loading = ref(false)
const error = ref('')

async function loadCaptcha() {
  const data = await authApi.getCaptcha()
  captchaId.value = data.captchaId
  captchaSvg.value = data.svg
}

onMounted(async () => {
  await loadCaptcha()
  try {
    avatars.value = (await authApi.getRegisterAvatars()).map((item) => ({
      id: normalizeAvatarId(item.id),
      url: item.url,
    }))
  } catch {
    /* optional avatars */
  }
})

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
      avatarId: selectedAvatarId.value || undefined,
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
    <form class="auth-card" @submit.prevent="submit">
      <div class="auth-brand">
        <div class="auth-brand-name">加入社区</div>
        <div class="auth-brand-desc">注册成为访客，参与留言与打卡</div>
      </div>

      <div class="auth-field">
        <label class="auth-label">用户名</label>
        <input v-model="username" class="auth-input" required />
      </div>
      <div class="auth-field">
        <label class="auth-label">密码</label>
        <input v-model="password" class="auth-input" type="password" required />
      </div>

      <div v-if="avatars.length" class="auth-field">
        <label class="auth-label">选择头像（可选）</label>
        <div class="avatar-options">
          <button
            v-for="item in avatars"
            :key="item.id"
            type="button"
            class="avatar-option"
            :class="{ selected: isSameAvatarId(selectedAvatarId, item.id) }"
            @click="selectedAvatarId = isSameAvatarId(selectedAvatarId, item.id) ? '' : item.id"
          >
            <img :src="item.url" alt="" />
          </button>
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label">验证码</label>
        <div class="auth-captcha-row">
          <input v-model="captchaText" class="auth-input" required />
          <div class="auth-captcha-box" v-html="captchaSvg" title="点击刷新" @click="loadCaptcha" />
        </div>
      </div>

      <div class="auth-checkbox-row">
        <input v-model="agreement" class="auth-checkbox" type="checkbox" id="agreement" />
        <label for="agreement" class="auth-agreement">
          我已阅读并同意
          <RouterLink to="/terms" target="_blank">用户协议</RouterLink>
        </label>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="auth-submit" :disabled="loading">
        {{ loading ? '提交中...' : '注册' }}
      </button>
      <p class="auth-footer">
        已有账号？
        <RouterLink to="/login">去登录</RouterLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
.avatar-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 0.625rem;
}

.avatar-option {
  border: 2px solid transparent;
  border-radius: 50%;
  padding: 0;
  background: none;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}

.avatar-option.selected {
  border-color: var(--accent-primary);
  transform: scale(1.05);
}

.avatar-option img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
</style>
