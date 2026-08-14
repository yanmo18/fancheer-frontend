<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import * as messageApi from '@/api/admin/message'
import * as reportApi from '@/api/admin/report'
import type { AdminMessageItem } from '@/api/admin/message'
import type { AdminReportItem } from '@/api/admin/report'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/datetime'

const auth = useAuthStore()

type MainTab = 'public' | 'private' | 'reports'
type ReportTab = 'pending' | 'resolved'

const mainTab = ref<MainTab>('public')
const reportTab = ref<ReportTab>('pending')

const messages = ref<AdminMessageItem[]>([])
const reports = ref<AdminReportItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const message = ref('')
const keyword = ref('')

const isStreamer = computed(() => auth.hasRole(['streamer']))

const tabs = computed(() => {
  const items: Array<{ id: MainTab; label: string }> = [
    { id: 'public', label: '公开留言' },
    { id: 'reports', label: '举报工单' },
  ]
  if (isStreamer.value) {
    items.splice(1, 0, { id: 'private', label: '私密留言' })
  }
  return items
})

async function loadMessages() {
  loading.value = true
  error.value = ''
  try {
    const data =
      mainTab.value === 'private'
        ? await messageApi.getPrivateMessages(page.value)
        : await messageApi.getPublicMessages(page.value, 20, keyword.value.trim() || undefined)
    messages.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadReports() {
  loading.value = true
  error.value = ''
  try {
    const data =
      reportTab.value === 'pending'
        ? await reportApi.getPendingReports(page.value)
        : await reportApi.getResolvedReports(page.value)
    reports.value = data.list
    totalPages.value = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function load() {
  page.value = 1
  if (mainTab.value === 'reports') {
    await loadReports()
  } else {
    await loadMessages()
  }
}

async function reloadCurrent() {
  if (mainTab.value === 'reports') {
    await loadReports()
  } else {
    await loadMessages()
  }
}

async function removeMessage(id: string) {
  if (!confirm('确定删除这条留言？')) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await messageApi.deleteMessage(id)
    message.value = '留言已删除'
    await reloadCurrent()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    loading.value = false
  }
}

async function resolveReport(id: string) {
  if (!confirm('确定标记此工单为已办结？')) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await reportApi.resolveReport(id)
    message.value = '工单已办结'
    await reloadCurrent()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    loading.value = false
  }
}

async function deleteViolation(id: string) {
  if (!confirm('确定删除被举报的违规留言？此操作不可撤销。')) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await reportApi.deleteViolationMessage(id)
    message.value = '违规留言已删除'
    await reloadCurrent()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    loading.value = false
  }
}

function searchPublic() {
  if (mainTab.value !== 'public') return
  page.value = 1
  loadMessages()
}

function prevPage() {
  if (page.value > 1) {
    page.value -= 1
    reloadCurrent()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value += 1
    reloadCurrent()
  }
}

watch(mainTab, () => {
  keyword.value = ''
  load()
})

watch(reportTab, () => {
  if (mainTab.value === 'reports') {
    page.value = 1
    loadReports()
  }
})

onMounted(load)
</script>

<template>
  <div class="message-admin">
    <header class="page-header">
      <div>
        <h1>留言与举报</h1>
        <p class="muted">审核公开留言、处理举报工单{{ isStreamer ? '，查看私密留言' : '' }}</p>
      </div>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab"
        :class="{ active: mainTab === tab.id }"
        @click="mainTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="mainTab === 'public'" class="filters card">
      <input v-model="keyword" placeholder="搜索留言内容" @keyup.enter="searchPublic" />
      <button type="button" class="btn btn-primary" @click="searchPublic">搜索</button>
    </div>

    <div v-if="mainTab === 'reports'" class="sub-tabs">
      <button
        type="button"
        class="sub-tab"
        :class="{ active: reportTab === 'pending' }"
        @click="reportTab = 'pending'"
      >
        待处理
      </button>
      <button
        type="button"
        class="sub-tab"
        :class="{ active: reportTab === 'resolved' }"
        @click="reportTab = 'resolved'"
      >
        已办结
      </button>
    </div>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !messages.length && !reports.length" class="muted">加载中...</div>

    <div v-else-if="mainTab !== 'reports'" class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>发送者</th>
            <th>内容</th>
            <th>点赞</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in messages" :key="item.id">
            <td>
              <strong>{{ item.senderNickname }}</strong>
              <p v-if="item.senderUsername" class="muted small">{{ item.senderUsername }}</p>
            </td>
            <td class="content">{{ item.content }}</td>
            <td>{{ item.likeCount }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td>
              <button type="button" class="btn btn-ghost danger" @click="removeMessage(item.id)">删除</button>
            </td>
          </tr>
          <tr v-if="!messages.length">
            <td colspan="5" class="muted center">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>举报人</th>
            <th>被举报内容</th>
            <th>发送者</th>
            <th>原因</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reports" :key="item.id">
            <td>{{ item.reporterNickname }}</td>
            <td class="content">{{ item.messageContent }}</td>
            <td>{{ item.messageSenderNickname || '—' }}</td>
            <td>{{ item.reason }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td class="actions">
              <template v-if="item.status === 'pending'">
                <button type="button" class="btn btn-ghost" @click="resolveReport(item.id)">办结</button>
                <button type="button" class="btn btn-ghost danger" @click="deleteViolation(item.id)">
                  删留言
                </button>
              </template>
              <span v-else class="muted">已办结</span>
            </td>
          </tr>
          <tr v-if="!reports.length">
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
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0 0 0.25rem;
}

.tabs,
.sub-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab,
.sub-tab {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  color: var(--text-muted);
}

.tab.active,
.sub-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.filters {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.filters input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
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

.content {
  max-width: 280px;
  word-break: break-word;
}

.small {
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
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

.success {
  color: #16a34a;
  margin-bottom: 0.5rem;
}
</style>
