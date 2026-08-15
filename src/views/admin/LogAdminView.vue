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

const filterAction = ref('')
const filterKeyword = ref('')
const filterOperator = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'ban_user', label: '封禁用户' },
  { value: 'unban_user', label: '解封用户' },
  { value: 'promote_admin', label: '设为协管员' },
  { value: 'demote_admin', label: '取消协管员' },
  { value: 'delete_message', label: '删除留言' },
  { value: 'create_streamer_reply', label: '公开回复留言' },
  { value: 'create_private_reply', label: '私密回复留言' },
  { value: 'resolve_report', label: '办结举报' },
  { value: 'delete_violation_message', label: '删除违规留言' },
  { value: 'update_streamer_info', label: '更新博主资料' },
  { value: 'create_graph_character', label: '新增图谱人物' },
  { value: 'update_graph_character', label: '更新图谱人物' },
  { value: 'delete_graph_character', label: '删除图谱人物' },
  { value: 'create_graph_relation', label: '新增图谱关系' },
  { value: 'update_graph_relation', label: '更新图谱关系' },
  { value: 'delete_graph_relation', label: '删除图谱关系' },
]

const actionLabels: Record<string, string> = Object.fromEntries(
  actionOptions.filter((item) => item.value).map((item) => [item.value, item.label]),
)

function actionLabel(action: string) {
  return actionLabels[action] || action
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await logApi.getAdminLogs(page.value, 20, {
      action: filterAction.value || undefined,
      keyword: filterKeyword.value.trim() || undefined,
      operator: filterOperator.value.trim() || undefined,
      startDate: filterStartDate.value || undefined,
      endDate: filterEndDate.value || undefined,
    })
    list.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function resetFilters() {
  filterAction.value = ''
  filterKeyword.value = ''
  filterOperator.value = ''
  filterStartDate.value = ''
  filterEndDate.value = ''
  page.value = 1
  load()
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
        <p class="muted">记录管理后台的关键操作，支持按类型、操作人、时间与关键词筛选</p>
      </div>
    </header>

    <div class="filters card">
      <label>
        操作类型
        <select v-model="filterAction">
          <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>
      <label>
        操作人
        <input v-model="filterOperator" placeholder="昵称或用户名" @keyup.enter="search" />
      </label>
      <label>
        开始日期
        <input v-model="filterStartDate" type="date" />
      </label>
      <label>
        结束日期
        <input v-model="filterEndDate" type="date" />
      </label>
      <label class="wide">
        关键词
        <input v-model="filterKeyword" placeholder="搜索详情内容" @keyup.enter="search" />
      </label>
      <div class="filter-actions">
        <button type="button" class="btn btn-primary" @click="search">筛选</button>
        <button type="button" class="btn btn-ghost" @click="resetFilters">重置</button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>操作</th>
            <th>操作人</th>
            <th>详情</th>
            <th>目标类型</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td><span class="badge">{{ actionLabel(item.action) }}</span></td>
            <td>{{ item.adminNickname || '—' }}</td>
            <td class="detail">{{ item.detail }}</td>
            <td class="muted">{{ item.targetType }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="5" class="muted center">暂无日志</td>
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

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  align-items: end;
}

.filters label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.filters label.wide {
  grid-column: span 2;
}

.filters input,
.filters select {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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
