<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as bannerApi from '@/api/admin/banner'
import type { AdminBannerItem } from '@/api/admin/banner'
import ImageUpload from '@/components/admin/ImageUpload.vue'
import { MAX_HOME_BANNERS } from '@/constants/banner'

const list = ref<AdminBannerItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const loading = ref(false)
const error = ref('')
const message = ref('')

const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  title: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
  isVisible: true,
})

function resetForm() {
  editingId.value = null
  form.title = ''
  form.imageUrl = ''
  form.linkUrl = ''
  form.sortOrder = 0
  form.isVisible = true
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await bannerApi.getAdminBanners(page.value)
    list.value = data.list
    totalPages.value = data.pagination.totalPages
    totalCount.value = data.pagination.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  if (totalCount.value >= MAX_HOME_BANNERS) {
    error.value = `首页 Banner 最多 ${MAX_HOME_BANNERS} 张，请先删除后再新增`
    return
  }
  resetForm()
  showForm.value = true
}

function openEdit(item: AdminBannerItem) {
  editingId.value = item.id
  form.title = item.title
  form.imageUrl = item.imageUrl
  form.linkUrl = item.linkUrl || ''
  form.sortOrder = item.sortOrder
  form.isVisible = item.isVisible
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function submit() {
  if (!form.imageUrl) {
    error.value = '请上传或填写图片 URL'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = {
      title: form.title,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      sortOrder: Number(form.sortOrder),
      isVisible: form.isVisible,
    }
    if (editingId.value) {
      await bannerApi.updateBanner(editingId.value, payload)
      message.value = '更新成功'
    } else {
      await bannerApi.createBanner(payload)
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
  if (!confirm('确定删除这条 Banner？')) return
  loading.value = true
  error.value = ''
  try {
    await bannerApi.deleteBanner(id)
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
  <div class="banner-admin">
    <header class="page-header">
      <div>
        <h1>Banner 管理</h1>
        <p class="muted">管理首页轮播展示内容（最多 {{ MAX_HOME_BANNERS }} 张，当前 {{ totalCount }} 张）</p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="totalCount >= MAX_HOME_BANNERS"
        @click="openCreate"
      >
        新增 Banner
      </button>
    </header>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>预览</th>
            <th>标题</th>
            <th>排序</th>
            <th>显示</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td><img :src="item.imageUrl" alt="" class="thumb" /></td>
            <td>{{ item.title || '—' }}</td>
            <td>{{ item.sortOrder }}</td>
            <td>{{ item.isVisible ? '是' : '否' }}</td>
            <td class="actions">
              <button type="button" class="btn btn-ghost" @click="openEdit(item)">编辑</button>
              <button type="button" class="btn btn-ghost danger" @click="remove(item.id)">删除</button>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="5" class="muted center">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="prevPage">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>

    <div v-if="showForm" class="modal-mask" @click.self="closeForm">
      <form class="card modal" @submit.prevent="submit">
        <h2>{{ editingId ? '编辑 Banner' : '新增 Banner' }}</h2>
        <label>
          标题
          <input v-model="form.title" maxlength="100" />
        </label>
        <ImageUpload v-model="form.imageUrl" category="banners" />
        <label>
          跳转链接
          <input v-model="form.linkUrl" placeholder="/ 或 https://..." />
        </label>
        <label>
          排序（越大越靠前）
          <input v-model.number="form.sortOrder" type="number" />
        </label>
        <label class="checkbox">
          <input v-model="form.isVisible" type="checkbox" />
          前台显示
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeForm">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">保存</button>
        </div>
      </form>
    </div>
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
  width: 120px;
  height: 56px;
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
input[type='number'] {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

.checkbox {
  flex-direction: row;
  align-items: center;
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
