<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as avatarApi from '@/api/admin/avatar'
import type { AdminAvatarItem } from '@/api/admin/avatar'
import ImageUpload from '@/components/admin/ImageUpload.vue'
import AppModal from '@/components/AppModal.vue'
import { formatDateTime } from '@/utils/datetime'

const list = ref<AdminAvatarItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const message = ref('')

const showForm = ref(false)
const newUrl = ref('')
const sortOrder = ref(0)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await avatarApi.getAdminAvatars(page.value)
    list.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newUrl.value = ''
  sortOrder.value = 0
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function submit() {
  if (!newUrl.value) {
    error.value = '请上传或填写头像 URL'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await avatarApi.createAvatar(newUrl.value, Number(sortOrder.value))
    message.value = '添加成功'
    closeForm()
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '添加失败'
  } finally {
    loading.value = false
  }
}

async function remove(item: AdminAvatarItem) {
  if (!confirm('确定删除这个预设头像？若有用户正在使用将无法删除。')) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await avatarApi.deleteAvatar(item.id)
    message.value = '已删除'
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value -= 1
    load()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value += 1
    load()
  }
}

onMounted(load)
</script>

<template>
  <div class="avatar-admin">
    <header class="page-header">
      <div>
        <h1>预设头像</h1>
        <p class="muted">注册时供访客选择的系统头像池</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreate">新增头像</button>
    </header>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>预览</th>
            <th>排序</th>
            <th>添加时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td><img :src="item.url" alt="" class="thumb" /></td>
            <td>{{ item.sortOrder }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td>
              <button type="button" class="btn btn-ghost danger" @click="remove(item)">删除</button>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="4" class="muted center">暂无预设头像</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="prevPage">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>

    <AppModal :open="showForm" title-id="avatar-admin-modal-title" @close="closeForm">
      <form class="card modal" @submit.prevent="submit">
        <h2 id="avatar-admin-modal-title">新增预设头像</h2>
        <ImageUpload v-model="newUrl" category="avatars" label="头像图片" />
        <label>
          排序（越大越靠前）
          <input v-model.number="sortOrder" type="number" />
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeForm">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">添加</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0 0 0.25rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.9375rem;
}

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.danger {
  color: var(--error);
}

.center {
  text-align: center;
}

.pager {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 100;
}

.modal {
  width: 100%;
  max-width: 420px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.modal h2 {
  margin: 0;
  font-size: 1.125rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.success {
  color: #16a34a;
  margin-bottom: 0.5rem;
}
</style>
