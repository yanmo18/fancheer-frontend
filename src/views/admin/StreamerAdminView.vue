<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as streamerApi from '@/api/admin/streamer'
import ImageUpload from '@/components/admin/ImageUpload.vue'

const loading = ref(false)
const error = ref('')
const message = ref('')

const form = reactive({
  name: '',
  avatarUrl: '',
  tags: '',
  bio: '',
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const info = await streamerApi.getAdminStreamerInfo()
    if (info) {
      form.name = info.name
      form.avatarUrl = info.avatarUrl
      form.tags = info.tags
      form.bio = info.bio
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!form.name.trim()) {
    error.value = '请填写博主名称'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await streamerApi.updateStreamerInfo({
      name: form.name.trim(),
      avatarUrl: form.avatarUrl,
      tags: form.tags.trim(),
      bio: form.bio.trim(),
    })
    message.value = '保存成功，首页将展示最新资料'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="streamer-admin">
    <header class="page-header">
      <div>
        <h1>博主资料</h1>
        <p class="muted">编辑首页展示的博主名称、头像、标签与简介</p>
      </div>
    </header>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <form v-if="!loading" class="card form" @submit.prevent="submit">
      <label>
        博主名称 *
        <input v-model="form.name" maxlength="50" required />
      </label>
      <ImageUpload v-model="form.avatarUrl" category="avatars" label="头像" />
      <label>
        标签
        <input v-model="form.tags" maxlength="200" placeholder="多个标签用英文逗号分隔，如：游戏,日常,音乐" />
      </label>
      <label>
        个人简介
        <textarea v-model="form.bio" rows="5" maxlength="500" placeholder="介绍一下你自己..." />
      </label>
      <div class="preview card" v-if="form.name || form.avatarUrl">
        <p class="preview-label muted">预览</p>
        <div class="preview-inner">
          <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="" class="avatar" />
          <div>
            <strong>{{ form.name || '博主名称' }}</strong>
            <p v-if="form.tags" class="tags">{{ form.tags.split(',').join(' · ') }}</p>
            <p v-if="form.bio" class="bio">{{ form.bio }}</p>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">保存</button>
      </div>
    </form>

    <p v-else class="muted">加载中...</p>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0 0 0.25rem;
}

.form {
  max-width: 560px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input,
textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

textarea {
  resize: vertical;
}

.preview {
  padding: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.preview-label {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
}

.preview-inner {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.tags {
  margin: 0.25rem 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.bio {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.success {
  color: #16a34a;
  margin-bottom: 0.5rem;
}
</style>
