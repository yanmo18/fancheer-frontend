<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as activityApi from '@/api/admin/activity'
import type { AdminActivityItem } from '@/api/admin/activity'
import ImageUpload from '@/components/admin/ImageUpload.vue'
import AppModal from '@/components/AppModal.vue'
import { formatDateTime, fromDatetimeLocalValue, toDatetimeLocalValue } from '@/utils/datetime'

const list = ref<AdminActivityItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const message = ref('')

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  title: '',
  description: '',
  coverUrl: '',
  startTime: '',
  endTime: '',
  sortOrder: 0,
})

function resetForm() {
  editingId.value = null
  form.title = ''
  form.description = ''
  form.coverUrl = ''
  form.startTime = ''
  form.endTime = ''
  form.sortOrder = 0
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await activityApi.getAdminActivities(page.value)
    list.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function openEdit(item: AdminActivityItem) {
  editingId.value = item.id
  form.title = item.title
  form.description = item.description || ''
  form.coverUrl = item.coverUrl || ''
  form.startTime = toDatetimeLocalValue(item.startTime)
  form.endTime = toDatetimeLocalValue(item.endTime)
  form.sortOrder = item.sortOrder
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function submit() {
  if (!form.title.trim()) {
    error.value = '请填写活动标题'
    return
  }
  if (!form.startTime) {
    error.value = '请选择开始时间'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      coverUrl: form.coverUrl || undefined,
      startTime: fromDatetimeLocalValue(form.startTime)!,
      endTime: form.endTime ? fromDatetimeLocalValue(form.endTime) : null,
      sortOrder: Number(form.sortOrder),
    }
    if (editingId.value) {
      await activityApi.updateActivity(editingId.value, payload)
      message.value = '更新成功'
    } else {
      await activityApi.createActivity(payload)
      message.value = '创建成功'
    }
    closeForm()
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  if (!confirm('确定删除这条活动？')) return
  loading.value = true
  error.value = ''
  try {
    await activityApi.deleteActivity(id)
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
  <div class="activity-admin">
    <header class="page-header">
      <div>
        <h1>活动管理</h1>
        <p class="muted">管理首页展示的活动信息</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreate">新增活动</button>
    </header>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>封面</th>
            <th>标题</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>
              <img v-if="item.coverUrl" :src="item.coverUrl" alt="" class="thumb" />
              <span v-else class="muted">—</span>
            </td>
            <td>{{ item.title }}</td>
            <td>{{ formatDateTime(item.startTime) }}</td>
            <td>{{ formatDateTime(item.endTime) }}</td>
            <td>{{ item.sortOrder }}</td>
            <td class="actions">
              <button type="button" class="btn btn-ghost" @click="openEdit(item)">编辑</button>
              <button type="button" class="btn btn-ghost danger" @click="remove(item.id)">删除</button>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="6" class="muted center">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="prevPage">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>

    <AppModal :open="showForm" title-id="activity-admin-modal-title" @close="closeForm">
      <form class="card modal" @submit.prevent="submit">
        <h2 id="activity-admin-modal-title">{{ editingId ? '编辑活动' : '新增活动' }}</h2>
        <label>
          活动标题 *
          <input v-model="form.title" maxlength="100" required />
        </label>
        <label>
          活动描述
          <textarea v-model="form.description" rows="3" maxlength="500" />
        </label>
        <ImageUpload v-model="form.coverUrl" category="activities" label="封面（可选）" />
        <label>
          开始时间 *
          <input v-model="form.startTime" type="datetime-local" required />
        </label>
        <label>
          结束时间
          <input v-model="form.endTime" type="datetime-local" />
        </label>
        <label>
          排序（越大越靠前）
          <input v-model.number="form.sortOrder" type="number" />
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeForm">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">保存</button>
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
  width: 72px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.actions {
  display: flex;
  gap: 0.5rem;
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
  max-width: 480px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-height: 90vh;
  overflow-y: auto;
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

input[type='text'],
input[type='number'],
input[type='datetime-local'],
textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.success {
  color: #16a34a;
  margin-bottom: 0.5rem;
}
</style>
