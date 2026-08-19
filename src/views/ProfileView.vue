<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import * as userApi from '@/api/user'
import * as checkinApi from '@/api/checkin'
import type { UserRole } from '@/types/api'
import { isSameAvatarId, normalizeAvatarId, resolveAvatarUrl } from '@/utils/avatar'

const auth = useAuthStore()
const nickname = ref('')
const avatars = ref<userApi.AvatarItem[]>([])
const loading = ref(false)
const message = ref('')
const error = ref('')
const checkinCount = ref<number | null>(null)

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

  const now = new Date()
  await Promise.all([
    userApi.getAvatars().then((list) => {
      avatars.value = list.map((item) => ({
        id: normalizeAvatarId(item.id),
        url: item.url,
      }))
    }),
    checkinApi
      .getCalendar(now.getFullYear(), now.getMonth() + 1)
      .then((data) => {
        checkinCount.value = data.checkedDates.length
      })
      .catch(() => {
        checkinCount.value = null
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
</script>

<template>
  <div class="user-page">
    <div class="user-layout">
      <section class="user-card user-card-full">
        <h2 class="user-card-title"><span class="user-card-title-icon">👤</span>个人资料</h2>

        <div class="user-profile-head">
          <div class="user-profile-avatar">
            <img v-if="currentAvatarUrl" :src="currentAvatarUrl" alt="" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'" />
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
          <span class="user-row-label">本月打卡</span>
          <span class="user-row-value">
            {{ checkinCount == null ? '—' : `${checkinCount} 天` }}
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
            <img :src="item.url" alt="" loading="lazy" />
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
