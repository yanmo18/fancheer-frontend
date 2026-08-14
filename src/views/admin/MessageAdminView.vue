<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import * as messageApi from '@/api/admin/message'
import * as reportApi from '@/api/admin/report'
import type { AdminMessageItem } from '@/api/admin/message'
import type { AdminReportDetail, AdminReportItem } from '@/api/admin/report'
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

const replyTarget = ref<AdminMessageItem | null>(null)
const replyContent = ref('')
const showReplyForm = ref(false)

const reportDetail = ref<AdminReportDetail | null>(null)
const showReportDetail = ref(false)
const detailLoading = ref(false)

function messageTypeLabel(type: string) {
  if (type === 'private') return '私密留言'
  if (type === 'public') return '公开留言'
  return type || '—'
}

function statusLabel(status: string) {
  return status === 'resolved' ? '已办结' : '待处理'
}

async function openReportDetail(id: string) {
  detailLoading.value = true
  error.value = ''
  showReportDetail.value = true
  reportDetail.value = null
  try {
    reportDetail.value = await reportApi.getReportDetail(id)
  } catch (e) {
    showReportDetail.value = false
    error.value = e instanceof Error ? e.message : '加载举报详情失败'
  } finally {
    detailLoading.value = false
  }
}

function closeReportDetail() {
  showReportDetail.value = false
  reportDetail.value = null
}

function openReply(item: AdminMessageItem) {
  replyTarget.value = item
  replyContent.value = ''
  showReplyForm.value = true
}

function closeReply() {
  replyTarget.value = null
  replyContent.value = ''
  showReplyForm.value = false
}

async function submitReply() {
  if (!replyTarget.value) return
  const text = replyContent.value.trim()
  if (!text) {
    error.value = '请填写回复内容'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    if (mainTab.value === 'private') {
      await messageApi.privateReply(replyTarget.value.id, text)
      message.value = '私密回复已发送'
    } else {
      await messageApi.streamerReply(replyTarget.value.id, text)
      message.value = '公开回复已发布'
    }
    closeReply()
    await reloadCurrent()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '回复失败'
  } finally {
    loading.value = false
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
    if (reportDetail.value?.id === id) {
      closeReportDetail()
    }
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
    if (reportDetail.value?.id === id) {
      closeReportDetail()
    }
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
        <p class="muted">审核公开留言、处理举报工单{{ isStreamer ? '，回复留言' : '' }}</p>
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
              <div class="actions">
                <button
                  v-if="isStreamer"
                  type="button"
                  class="btn btn-ghost"
                  @click="openReply(item)"
                >
                  回复
                </button>
                <button type="button" class="btn btn-ghost danger" @click="removeMessage(item.id)">删除</button>
              </div>
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
            <th>状态</th>
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
            <td>
              <span class="status-badge" :class="item.status">{{ statusLabel(item.status) }}</span>
            </td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td class="actions">
              <button type="button" class="btn btn-ghost" @click="openReportDetail(item.id)">详情</button>
              <template v-if="item.status === 'pending'">
                <button type="button" class="btn btn-ghost" @click="resolveReport(item.id)">办结</button>
                <button type="button" class="btn btn-ghost danger" @click="deleteViolation(item.id)">
                  删留言
                </button>
              </template>
            </td>
          </tr>
          <tr v-if="!reports.length">
            <td colspan="7" class="muted center">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pager">
      <button type="button" class="btn btn-ghost" :disabled="page <= 1" @click="prevPage">上一页</button>
      <span class="muted">{{ page }} / {{ totalPages }}</span>
      <button type="button" class="btn btn-ghost" :disabled="page >= totalPages" @click="nextPage">下一页</button>
    </div>
    <div v-if="showReportDetail" class="modal-mask" @click.self="closeReportDetail">
      <div class="card modal detail-modal">
        <header class="detail-head">
          <div>
            <h2>举报详情</h2>
            <p v-if="reportDetail" class="muted small">工单 #{{ reportDetail.id }}</p>
          </div>
          <button type="button" class="btn btn-ghost" @click="closeReportDetail">关闭</button>
        </header>

        <p v-if="detailLoading" class="muted">加载中...</p>

        <template v-else-if="reportDetail">
          <div class="detail-grid">
            <section class="detail-block">
              <h3>工单信息</h3>
              <dl>
                <div><dt>状态</dt><dd><span class="status-badge" :class="reportDetail.status">{{ statusLabel(reportDetail.status) }}</span></dd></div>
                <div><dt>举报时间</dt><dd>{{ formatDateTime(reportDetail.createdAt) }}</dd></div>
                <div v-if="reportDetail.resolvedAt"><dt>办结时间</dt><dd>{{ formatDateTime(reportDetail.resolvedAt) }}</dd></div>
                <div><dt>同留言举报</dt><dd>{{ reportDetail.relatedReportCount }} 次</dd></div>
              </dl>
            </section>

            <section class="detail-block">
              <h3>举报人</h3>
              <dl>
                <div><dt>昵称</dt><dd>{{ reportDetail.reporterNickname || '—' }}</dd></div>
                <div><dt>用户名</dt><dd>{{ reportDetail.reporterUsername || '—' }}</dd></div>
                <div><dt>用户 ID</dt><dd>{{ reportDetail.reporterId }}</dd></div>
              </dl>
            </section>

            <section class="detail-block full">
              <h3>举报原因</h3>
              <p class="quote">{{ reportDetail.reason || '（未填写）' }}</p>
            </section>

            <section class="detail-block full">
              <h3>被举报留言</h3>
              <dl>
                <div><dt>类型</dt><dd>{{ messageTypeLabel(reportDetail.messageType) }}</dd></div>
                <div><dt>发送者</dt><dd>{{ reportDetail.messageSenderNickname || '—' }}（{{ reportDetail.messageSenderUsername || '—' }}）</dd></div>
                <div><dt>留言 ID</dt><dd>{{ reportDetail.messageId }}</dd></div>
                <div v-if="reportDetail.messageCreatedAt"><dt>发送时间</dt><dd>{{ formatDateTime(reportDetail.messageCreatedAt) }}</dd></div>
                <div><dt>点赞数</dt><dd>{{ reportDetail.messageLikeCount }}</dd></div>
              </dl>
              <p class="quote message-content">{{ reportDetail.messageContent || '（留言已不可见）' }}</p>
            </section>
          </div>

          <div v-if="reportDetail.status === 'pending'" class="detail-actions">
            <button type="button" class="btn btn-ghost" @click="resolveReport(reportDetail.id)">标记办结</button>
            <button type="button" class="btn btn-ghost danger" @click="deleteViolation(reportDetail.id)">
              删除违规留言
            </button>
          </div>
        </template>
      </div>
    </div>

    <div v-if="showReplyForm && replyTarget" class="modal-mask" @click.self="closeReply">
      <form class="card modal" @submit.prevent="submitReply">
        <h2>{{ mainTab === 'private' ? '私密回复' : '公开回复' }}</h2>
        <p class="muted quote">原留言：{{ replyTarget.content }}</p>
        <p class="muted small">发送者：{{ replyTarget.senderNickname }}</p>
        <label>
          回复内容 *
          <textarea
            v-model="replyContent"
            rows="4"
            maxlength="500"
            :placeholder="mainTab === 'private' ? '仅该用户可见' : '所有人可见，会显示在留言板「博主回复」'"
            required
          />
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeReply">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">发送回复</button>
        </div>
      </form>
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

.quote {
  margin: 0;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.875rem;
  word-break: break-word;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.detail-modal {
  max-width: 640px;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.detail-head h2 {
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.detail-block {
  padding: 0.875rem;
  background: #f8fafc;
  border-radius: 10px;
}

.detail-block.full {
  grid-column: 1 / -1;
}

.detail-block h3 {
  margin: 0 0 0.625rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 600;
}

.detail-block dl {
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.detail-block dl > div {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-block dt {
  color: var(--text-muted);
}

.detail-block dd {
  margin: 0;
  word-break: break-word;
}

.message-content {
  margin-top: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.resolved {
  background: #f1f5f9;
  color: #64748b;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
