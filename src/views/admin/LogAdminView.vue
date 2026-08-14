<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as logApi from '@/api/admin/log'
import type { AdminLogItem } from '@/api/admin/log'
import { formatDateTime } from '@/utils/datetime'

const list = ref<AdminLogItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')

const actionLabels: Record<string, string> = {
  ban_user: '封禁用户',
  unban_user: '解封用户',
  promote_admin: '设为协管员',
  demote_admin: '取消协管员',
  delete_message: '删除留言',
  create_avatar: '新增头像',
  delete_avatar: '删除头像',
  create_sensitive_word: '新增敏感词',
  delete_sensitive_word: '删除敏感词',
  update_streamer_info: '更新博主资料',
  resolve_report: '办结举报',
  delete_violation_message: '删除违规留言',
  create_award: '新增荣誉',
  update_award: '更新荣誉',
  delete_award: '删除荣誉',
}

function actionLabel(action: string) {
  return actionLabels[action] || action
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await logApi.getAdminLogs(page.value)
    list.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
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
  <div class="log-admin">
    <header class="page-header">
      <div>
        <h1>操作日志</h1>
        <p class="muted">记录管理后台的关键操作</p>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>操作</th>
            <th>详情</th>
            <th>目标类型</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td><span class="badge">{{ actionLabel(item.action) }}</span></td>
            <td class="detail">{{ item.detail }}</td>
            <td class="muted">{{ item.targetType }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="4" class="muted center">暂无日志</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="prevPage">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.page-header {
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
  vertical-align: top;
}

.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  background: #eef2ff;
  color: var(--primary);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.detail {
  max-width: 360px;
  word-break: break-word;
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
</style>
