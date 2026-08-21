<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as sensitiveWordApi from '@/api/admin/sensitiveWord'
import type { AdminSensitiveWordItem } from '@/api/admin/sensitiveWord'
import AppModal from '@/components/AppModal.vue'
import { formatDateTime } from '@/utils/datetime'

const list = ref<AdminSensitiveWordItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const message = ref('')

const showForm = ref(false)
const newWord = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await sensitiveWordApi.getSensitiveWords(page.value)
    list.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newWord.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  newWord.value = ''
}

async function submit() {
  const word = newWord.value.trim()
  if (!word) {
    error.value = '请填写敏感词'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await sensitiveWordApi.createSensitiveWord(word)
    message.value = '添加成功'
    closeForm()
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '添加失败'
  } finally {
    loading.value = false
  }
}

async function remove(item: AdminSensitiveWordItem) {
  if (!confirm(`确定删除敏感词「${item.word}」？`)) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await sensitiveWordApi.deleteSensitiveWord(item.id)
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
  <div class="sensitive-word-admin">
    <header class="page-header">
      <div>
        <h1>敏感词管理</h1>
        <p class="muted">留言与昵称等内容命中敏感词将被拦截</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreate">新增敏感词</button>
    </header>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>敏感词</th>
            <th>添加时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td><code class="word">{{ item.word }}</code></td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td>
              <button type="button" class="btn btn-ghost danger" @click="remove(item)">删除</button>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="3" class="muted center">暂无敏感词</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="prevPage">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>

    <AppModal :open="showForm" title-id="sensitive-word-modal-title" @close="closeForm">
      <form class="card modal" @submit.prevent="submit">
        <h2 id="sensitive-word-modal-title">新增敏感词</h2>
        <label>
          敏感词 *
          <input v-model="newWord" maxlength="50" placeholder="输入要拦截的词" required />
        </label>
        <p class="hint muted">添加后立即生效，留言发送时会进行匹配检测。</p>
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

.word {
  padding: 0.125rem 0.5rem;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 6px;
  font-size: 0.875rem;
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
  max-width: 400px;
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

.hint {
  margin: 0;
  font-size: 0.8125rem;
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
