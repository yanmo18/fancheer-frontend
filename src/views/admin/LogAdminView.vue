<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const actionGroups = [
  {
    label: '用户',
    items: [
      { value: 'ban_user', label: '封禁用户' },
      { value: 'unban_user', label: '解封用户' },
      { value: 'promote_admin', label: '设为协管员' },
      { value: 'demote_admin', label: '取消协管员' },
    ],
  },
  {
    label: '留言',
    items: [
      { value: 'delete_message', label: '删除留言' },
      { value: 'create_streamer_reply', label: '公开回复留言' },
      { value: 'create_private_reply', label: '私密回复留言' },
      { value: 'create_public_private_reply', label: '公开发布私密回复' },
      { value: 'resolve_report', label: '办结举报' },
      { value: 'delete_violation_message', label: '删除违规留言' },
    ],
  },
  {
    label: '内容',
    items: [
      { value: 'update_streamer_info', label: '更新博主资料' },
      { value: 'create_banner', label: '新增 Banner' },
      { value: 'update_banner', label: '更新 Banner' },
      { value: 'delete_banner', label: '删除 Banner' },
      { value: 'create_song', label: '新增歌曲' },
      { value: 'update_song', label: '更新歌曲' },
      { value: 'delete_song', label: '删除歌曲' },
      { value: 'create_activity', label: '新增活动' },
      { value: 'update_activity', label: '更新活动' },
      { value: 'delete_activity', label: '删除活动' },
      { value: 'create_award', label: '新增荣誉' },
      { value: 'update_award', label: '更新荣誉' },
      { value: 'delete_award', label: '删除荣誉' },
      { value: 'create_gallery_image', label: '新增图集' },
      { value: 'update_gallery_image', label: '更新图集' },
      { value: 'delete_gallery_image', label: '删除图集' },
    ],
  },
  {
    label: '图谱与词库',
    items: [
      { value: 'create_graph_character', label: '新增图谱人物' },
      { value: 'update_graph_character', label: '更新图谱人物' },
      { value: 'delete_graph_character', label: '删除图谱人物' },
      { value: 'create_graph_relation', label: '新增图谱关系' },
      { value: 'update_graph_relation', label: '更新图谱关系' },
      { value: 'delete_graph_relation', label: '删除图谱关系' },
      { value: 'create_avatar', label: '新增预设头像' },
      { value: 'delete_avatar', label: '删除预设头像' },
      { value: 'create_sensitive_word', label: '新增敏感词' },
      { value: 'delete_sensitive_word', label: '删除敏感词' },
    ],
  },
]

const actionLabels: Record<string, string> = Object.fromEntries(
  actionGroups.flatMap((group) => group.items).map((item) => [item.value, item.label]),
)

const hasFilters = computed(
  () =>
    Boolean(filterAction.value) ||
    Boolean(filterKeyword.value.trim()) ||
    Boolean(filterOperator.value.trim()) ||
    Boolean(filterStartDate.value) ||
    Boolean(filterEndDate.value),
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
          <option value="">全部操作</option>
          <optgroup v-for="group in actionGroups" :key="group.label" :label="group.label">
            <option v-for="opt in group.items" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </optgroup>
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
            <td colspan="5" class="muted center">{{ hasFilters ? '没有符合筛选的日志' : '暂无操作日志' }}</td>
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
