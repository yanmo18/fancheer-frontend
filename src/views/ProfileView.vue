<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
  <div class="page">
    <h1>个人中心</h1>

    <div class="card section profile-head">
      <img
        v-if="currentAvatarUrl"
        :src="currentAvatarUrl"
        alt=""
        class="current-avatar"
      />
      <div v-else class="current-avatar fallback">{{ nickname.slice(0, 1) || '?' }}</div>
      <div>
        <strong>{{ auth.user?.nickname || auth.user?.username }}</strong>
        <p class="muted">@{{ auth.user?.username }}</p>
      </div>
    </div>

    <div class="card section">
      <h2>基本信息</h2>
      <p class="muted">角色：{{ auth.user?.role ? roleLabels[auth.user.role] : '—' }}</p>
      <label>
        展示昵称
        <input v-model="nickname" maxlength="10" />
      </label>
      <button type="button" class="btn btn-primary" :disabled="loading" @click="saveNickname">
        保存昵称
      </button>
    </div>

    <div class="card section">
      <h2>选择头像</h2>
      <p v-if="!avatars.length" class="muted">暂无预设头像，请联系博主添加</p>
      <div v-else class="avatar-grid">
        <button
          v-for="item in avatars"
          :key="item.id"
          type="button"
          class="avatar-btn"
          :class="{ selected: selectedAvatarId === item.id }"
          :disabled="loading"
          @click="pickAvatar(item.id)"
        >
          <img :src="item.url" alt="" />
        </button>
      </div>
    </div>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.section {
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section h2 {
  margin: 0;
  font-size: 1rem;
}

.profile-head {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.current-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.current-avatar.fallback {
  display: grid;
  place-items: center;
  background: #e0e7ff;
  color: var(--primary);
  font-size: 1.5rem;
  font-weight: 700;
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

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 0.75rem;
}

.avatar-btn {
  border: 2px solid transparent;
  border-radius: 50%;
  padding: 0;
  background: none;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.avatar-btn.selected {
  border-color: var(--primary);
  transform: scale(1.05);
}

.avatar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.avatar-btn img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.success {
  color: #16a34a;
}
</style>
