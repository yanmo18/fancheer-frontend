<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import * as userApi from '@/api/user'
import * as checkinApi from '@/api/checkin'
import type { UserRole } from '@/types/api'
import { isSameAvatarId, normalizeAvatarId, resolveAvatarUrl } from '@/utils/avatar'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import PasswordInput from '@/components/PasswordInput.vue'
import { useCooldown } from '@/composables/useCooldown'

const auth = useAuthStore()
const nickname = ref('')
const avatars = ref<userApi.AvatarItem[]>([])
const loading = ref(false)
const message = ref('')
const error = ref('')
const checkinTotal = ref<number | null>(null)
const checkinStreak = ref<number | null>(null)
const checkedToday = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordMessage = ref('')
const passwordError = ref('')
const passwordCooldown = useCooldown()

const roleLabels: Record<UserRole, string> = {
  fan: '访客',
  admin: '协管员',
  streamer: '站主',
}

const selectedAvatarId = computed(() => normalizeAvatarId(auth.user?.avatarId))

const currentAvatarUrl = computed(() => {
  const fromUser = resolveAvatarUrl(auth.user?.avatar, auth.user?.avatarUrl)
  if (fromUser) return fromUser

  const picked = avatars.value.find((item) => isSameAvatarId(item.id, selectedAvatarId.value))
  return picked?.url || ''
})

const joinDateLabel = computed(() => {
  if (!auth.user?.createdAt) return '—'
  const date = new Date(auth.user.createdAt)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
})

const nicknameChanged = computed(
  () => nickname.value.trim() !== (auth.user?.nickname || '').trim(),
)

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchMe()
  }

  nickname.value = auth.user?.nickname || ''

  await Promise.all([
    userApi.getAvatars().then((list) => {
      avatars.value = list.map((item) => ({
        id: normalizeAvatarId(item.id),
        url: item.url,
      }))
    }),
    checkinApi
      .getStats()
      .then((data) => {
        checkinTotal.value = data.totalDays
        checkinStreak.value = data.currentStreak
        checkedToday.value = data.checkedToday
      })
      .catch(() => {
        checkinTotal.value = null
        checkinStreak.value = null
        checkedToday.value = false
      }),
  ]).catch((e) => {
    error.value = e instanceof Error ? e.message : '加载资料失败'
  })
})

async function saveNickname() {
  if (!nicknameChanged.value) {
    message.value = '昵称未修改'
    return
  }

  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await userApi.updateNickname(nickname.value.trim())
    await auth.fetchMe()
    nickname.value = auth.user?.nickname || ''
    message.value = '昵称已更新'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '更新失败'
  } finally {
    loading.value = false
  }
}

async function pickAvatar(id: string) {
  const nextId = normalizeAvatarId(id)
  if (!nextId || isSameAvatarId(nextId, selectedAvatarId.value)) return

  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await userApi.updateAvatar(nextId)
    await auth.fetchMe()
    message.value = '头像已更新'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '头像更新失败'
  } finally {
    loading.value = false
  }
}

function avatarInitial() {
  return (auth.user?.nickname || auth.user?.username || '?').slice(0, 1).toUpperCase()
}

const passwordReady = computed(() =>
  Boolean(currentPassword.value && newPassword.value && confirmPassword.value),
)

function resetPasswordForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

async function savePassword() {
  if (passwordCooldown.left > 0) return
  passwordMessage.value = ''
  passwordError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }

  passwordLoading.value = true
  try {
    await userApi.changePassword(currentPassword.value, newPassword.value, confirmPassword.value)
    resetPasswordForm()
    passwordMessage.value = '密码已更新，之后请用新密码登录'
  } catch (e) {
    passwordError.value = e instanceof Error ? e.message : '修改密码失败'
    passwordCooldown.startFromError(e, 60_000)
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="user-page">
    <div class="user-layout">
      <section class="user-card user-card-full">
        <h2 class="user-card-title"><span class="user-card-title-icon">👤</span>个人资料</h2>

        <div class="user-profile-head">
          <div class="user-profile-avatar">
            <img v-if="currentAvatarUrl" :src="resolveMediaUrl(currentAvatarUrl)" alt="" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'" />
            <span class="avatar-fallback">{{ avatarInitial() }}</span>
          </div>
          <div>
            <div class="user-profile-name">{{ auth.user?.nickname || auth.user?.username }}</div>
            <div class="user-profile-handle muted">@{{ auth.user?.username }}</div>
          </div>
        </div>

        <div class="user-row">
          <span class="user-row-label">用户名</span>
          <span class="user-row-value">{{ auth.user?.username || '—' }}</span>
        </div>
        <div class="user-row">
          <span class="user-row-label">角色</span>
          <span class="user-row-value">{{ auth.user?.role ? roleLabels[auth.user.role] : '—' }}</span>
        </div>
        <div class="user-row">
          <span class="user-row-label">注册时间</span>
          <span class="user-row-value">{{ joinDateLabel }}</span>
        </div>
        <div class="user-row">
          <span class="user-row-label">打卡</span>
          <span class="user-row-value">
            <template v-if="checkinTotal != null">
              累计 {{ checkinTotal }} 天
              <span class="muted"> · 连续 {{ checkinStreak ?? 0 }} 天</span>
              <span v-if="checkedToday" class="muted"> · 今日已打</span>
            </template>
            <template v-else>—</template>
            <RouterLink to="/checkin" class="user-row-link">去打卡</RouterLink>
          </span>
        </div>

        <div class="user-row user-row-edit">
          <span class="user-row-label">展示昵称</span>
          <input v-model="nickname" class="user-text-input" maxlength="10" placeholder="2-10 个字符" />
        </div>
        <div class="user-actions">
          <button
            type="button"
            class="user-btn user-btn-primary"
            :disabled="loading || !nicknameChanged"
            @click="saveNickname"
          >
            保存昵称
          </button>
        </div>
      </section>

      <section class="user-card user-card-third">
        <h2 class="user-card-title"><span class="user-card-title-icon">🔑</span>修改密码</h2>
        <p class="avatar-tip muted">用户名不可改。请输入当前密码与 6–20 位新密码。</p>

        <div class="user-row user-row-edit">
          <span class="user-row-label">当前密码</span>
          <PasswordInput
            v-model="currentPassword"
            input-class="user-text-input"
            autocomplete="current-password"
            :maxlength="20"
            placeholder="当前密码"
          />
        </div>
        <div class="user-row user-row-edit">
          <span class="user-row-label">新密码</span>
          <PasswordInput
            v-model="newPassword"
            input-class="user-text-input"
            autocomplete="new-password"
            :maxlength="20"
            placeholder="6-20 个字符"
          />
        </div>
        <div class="user-row user-row-edit">
          <span class="user-row-label">确认新密码</span>
          <PasswordInput
            v-model="confirmPassword"
            input-class="user-text-input"
            autocomplete="new-password"
            :maxlength="20"
            placeholder="再输入一次"
          />
        </div>
        <div class="user-actions">
          <button
            type="button"
            class="user-btn user-btn-primary"
            :disabled="passwordLoading || !passwordReady || passwordCooldown.left > 0"
            @click="savePassword"
          >
            {{
              passwordLoading
                ? '保存中...'
                : passwordCooldown.left > 0
                  ? `请 ${passwordCooldown.left} 秒后再试`
                  : '更新密码'
            }}
          </button>
        </div>
        <p v-if="passwordMessage" class="success password-flash">{{ passwordMessage }}</p>
        <p v-if="passwordError" class="error password-flash">{{ passwordError }}</p>
      </section>

      <section class="user-card user-card-wide">
        <h2 class="user-card-title"><span class="user-card-title-icon">🎭</span>选择头像</h2>
        <p class="avatar-tip muted">从预设头像池中选择，将同步显示在导航栏与聊天室。</p>

        <p v-if="!avatars.length" class="muted">暂无预设头像，请联系博主在后台添加。</p>
        <div v-else class="avatar-options">
          <button
            v-for="item in avatars"
            :key="item.id"
            type="button"
            class="avatar-option"
            :class="{ selected: isSameAvatarId(item.id, selectedAvatarId) }"
            :disabled="loading"
            :aria-label="`选择头像 ${item.id}`"
            @click="pickAvatar(item.id)"
          >
            <img :src="resolveMediaUrl(item.url)" alt="" loading="lazy" />
            <span v-if="isSameAvatarId(item.id, selectedAvatarId)" class="avatar-option-check">✓</span>
          </button>
        </div>
      </section>
    </div>

    <p v-if="message" class="success user-flash">{{ message }}</p>
    <p v-if="error" class="error user-flash">{{ error }}</p>
  </div>
</template>

<style scoped>
.user-profile-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.user-profile-avatar {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--accent-gradient);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-profile-avatar img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.user-profile-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-profile-handle {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.user-row-edit {
  margin-top: 0.5rem;
}

.user-actions {
  margin-top: 0.75rem;
}

.avatar-tip {
  margin: -0.5rem 0 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.user-flash {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 48px 1rem;
}

.password-flash {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}

.avatar-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 0.875rem;
}

.avatar-option {
  position: relative;
  border: 2px solid var(--border-subtle);
  border-radius: 50%;
  padding: 2px;
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.avatar-option:hover:not(:disabled) {
  border-color: var(--border-accent);
  transform: translateY(-1px);
}

.avatar-option.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.avatar-option:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.avatar-option img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.avatar-option-check {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #fff;
  font-size: 0.625rem;
  display: grid;
  place-items: center;
  border: 2px solid var(--bg-card);
}
</style>
