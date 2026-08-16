<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import * as userApi from '@/api/user'
import type { UserRole } from '@/types/api'

const auth = useAuthStore()
const nickname = ref('')
const avatars = ref<userApi.AvatarItem[]>([])
const loading = ref(false)
const message = ref('')
const error = ref('')

const roleLabels: Record<UserRole, string> = {
  fan: '访客',
  admin: '协管员',
  streamer: '站主',
}

const currentAvatarUrl = computed(
  () => auth.user?.avatar || auth.user?.avatarUrl || '',
)

const selectedAvatarId = computed(() => auth.user?.avatarId || '')

onMounted(async () => {
  nickname.value = auth.user?.nickname || ''
  try {
    avatars.value = await userApi.getAvatars()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载头像失败'
  }
})

async function saveNickname() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await userApi.updateNickname(nickname.value)
    await auth.fetchMe()
    message.value = '昵称已更新'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '更新失败'
  } finally {
    loading.value = false
  }
}

async function pickAvatar(id: string) {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    await userApi.updateAvatar(id)
    await auth.fetchMe()
    message.value = '头像已更新'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '更新失败'
  } finally {
    loading.value = false
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
            <img v-if="currentAvatarUrl" :src="currentAvatarUrl" alt="" />
            <span v-else>{{ (nickname || auth.user?.username || '?').slice(0, 1) }}</span>
          </div>
          <div>
            <div class="user-profile-name">{{ auth.user?.nickname || auth.user?.username }}</div>
            <div class="user-profile-handle muted">@{{ auth.user?.username }}</div>
          </div>
        </div>
        <div class="user-row">
          <span class="user-row-label">角色</span>
          <span class="user-row-value">{{ auth.user?.role ? roleLabels[auth.user.role] : '—' }}</span>
        </div>
        <div class="user-row">
          <span class="user-row-label">展示昵称</span>
          <input v-model="nickname" class="user-text-input" maxlength="10" />
        </div>
        <button type="button" class="user-btn user-btn-primary" :disabled="loading" @click="saveNickname">
          保存昵称
        </button>
      </section>

      <section class="user-card user-card-wide">
        <h2 class="user-card-title"><span class="user-card-title-icon">🎭</span>选择头像</h2>
        <p v-if="!avatars.length" class="muted">暂无预设头像，请联系博主添加</p>
        <div v-else class="avatar-options">
          <button
            v-for="item in avatars"
            :key="item.id"
            type="button"
            class="avatar-option"
            :class="{ selected: selectedAvatarId === item.id }"
            :disabled="loading"
            @click="pickAvatar(item.id)"
          >
            <img :src="item.url" alt="" />
          </button>
        </div>
      </section>

      <section class="user-card user-card-third">
        <h2 class="user-card-title"><span class="user-card-title-icon">📅</span>快捷入口</h2>
        <RouterLink to="/checkin" class="user-quick-link">每日打卡 →</RouterLink>
        <RouterLink to="/messages" class="user-quick-link">聊天室 →</RouterLink>
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
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.user-quick-link {
  display: block;
  padding: 0.75rem 0;
  color: var(--accent-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--border-subtle);
}

.user-quick-link:last-child {
  border-bottom: none;
}

.user-flash {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 48px 1rem;
}

.avatar-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 0.75rem;
}

.avatar-option {
  border: 2px solid transparent;
  border-radius: 50%;
  padding: 0;
  background: none;
  cursor: pointer;
}

.avatar-option.selected {
  border-color: var(--accent-primary);
}

.avatar-option img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
</style>
