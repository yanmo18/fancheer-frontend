<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import * as messagesApi from '@/api/messages'
import type { MessageItem, PrivateReplyItem, PublicReplyItem, SentPrivateMessageItem } from '@/types/api'
import { formatDateTime } from '@/utils/datetime'

type Tab = 'public' | 'private'

const tab = ref<Tab>('public')
const messages = ref<MessageItem[]>([])
const publicReplies = ref<PublicReplyItem[]>([])
const privateReplies = ref<PrivateReplyItem[]>([])
const sentPrivateMessages = ref<SentPrivateMessageItem[]>([])
const content = ref('')
const loading = ref(true)
const loadingMore = ref(false)
const hasMoreMessages = ref(false)
const sending = ref(false)
const error = ref('')
const success = ref('')

const PAGE_SIZE = 20

const reportTarget = ref<MessageItem | null>(null)
const reportReason = ref('')

function isLiked(msg: MessageItem) {
  return msg.isLiked ?? msg.liked ?? false
}

function beforeCursor(items: MessageItem[]) {
  const last = items[items.length - 1]
  return last ? String(last.createdAt) : undefined
}

async function loadPublic(reset = true) {
  if (reset) {
    loading.value = true
  }
  error.value = ''
  try {
    const msgList = await messagesApi.getPublicMessages({ limit: PAGE_SIZE })
    messages.value = msgList
    hasMoreMessages.value = msgList.length >= PAGE_SIZE
    if (reset) {
      publicReplies.value = await messagesApi.getPublicReplies({ limit: 10 })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    if (reset) {
      loading.value = false
    }
  }
}

async function loadMoreMessages() {
  if (!hasMoreMessages.value || loadingMore.value || !messages.value.length) return
  loadingMore.value = true
  error.value = ''
  try {
    const batch = await messagesApi.getPublicMessages({
      before: beforeCursor(messages.value),
      limit: PAGE_SIZE,
    })
    messages.value = [...messages.value, ...batch]
    hasMoreMessages.value = batch.length >= PAGE_SIZE
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载更多失败'
  } finally {
    loadingMore.value = false
  }
}

async function loadPrivate() {
  loading.value = true
  error.value = ''
  try {
    const [replies, sent] = await Promise.all([
      messagesApi.getPrivateReplies(),
      messagesApi.getSentPrivateMessages(),
    ])
    privateReplies.value = replies.list
    sentPrivateMessages.value = sent.list
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function load() {
  if (tab.value === 'public') {
    await loadPublic(true)
  } else {
    await loadPrivate()
  }
}

const composePlaceholder = computed(() =>
  tab.value === 'public' ? '写下你的公开留言...' : '仅博主可见的私密留言...',
)

async function send() {
  if (!content.value.trim()) return
  sending.value = true
  error.value = ''
  success.value = ''
  try {
    await messagesApi.sendMessage(content.value.trim(), tab.value)
    content.value = ''
    success.value = tab.value === 'public' ? '留言已发布' : '私密留言已发送，博主回复后会显示在这里'
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '发送失败'
  } finally {
    sending.value = false
  }
}

async function toggleLike(msg: MessageItem) {
  try {
    if (isLiked(msg)) {
      await messagesApi.unlikeMessage(msg.id)
      msg.isLiked = false
      msg.liked = false
      msg.likeCount = Math.max(0, msg.likeCount - 1)
    } else {
      await messagesApi.likeMessage(msg.id)
      msg.isLiked = true
      msg.liked = true
      msg.likeCount += 1
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败'
  }
}

function openReport(msg: MessageItem) {
  reportTarget.value = msg
  reportReason.value = ''
}

function closeReport() {
  reportTarget.value = null
  reportReason.value = ''
}

async function submitReport() {
  if (!reportTarget.value) return
  const reason = reportReason.value.trim()
  if (!reason) {
    error.value = '请填写举报原因'
    return
  }
  try {
    await messagesApi.reportMessage(reportTarget.value.id, reason)
    success.value = '举报已提交，我们会尽快处理'
    closeReport()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '举报失败'
  }
}

watch(tab, () => {
  success.value = ''
  load()
})

onMounted(load)
</script>

<template>
  <div class="page">
    <h1>留言板</h1>
    <p class="muted intro">与博主互动：公开留言所有人可见，私密留言仅博主可见</p>

    <div class="tabs">
      <button type="button" class="tab" :class="{ active: tab === 'public' }" @click="tab = 'public'">
        公开留言
      </button>
      <button type="button" class="tab" :class="{ active: tab === 'private' }" @click="tab = 'private'">
        私信博主
      </button>
    </div>

    <form class="card compose" @submit.prevent="send">
      <textarea
        v-model="content"
        rows="3"
        :placeholder="composePlaceholder"
        maxlength="500"
      />
      <div class="compose-foot">
        <span class="muted hint">{{ tab === 'public' ? '公开可见' : '仅博主可见' }}</span>
        <button type="submit" class="btn btn-primary" :disabled="sending">
          {{ sending ? '发送中...' : '发送' }}
        </button>
      </div>
    </form>

    <p v-if="success" class="success">{{ success }}</p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="loading" class="muted">加载中...</p>

    <template v-else-if="tab === 'public'">
      <section v-if="publicReplies.length" class="section">
        <h2 class="section-title">博主回复</h2>
        <div class="message-list">
          <article v-for="reply in publicReplies" :key="reply.id" class="card message reply">
            <div class="meta">
              <div class="author">
                <img v-if="reply.streamerAvatar" :src="reply.streamerAvatar" alt="" class="avatar" />
                <strong>{{ reply.streamerNickname || '博主' }}</strong>
                <span class="badge">官方回复</span>
              </div>
              <span class="muted">{{ formatDateTime(reply.createdAt) }}</span>
            </div>
            <p v-if="reply.originalContent" class="quote muted">回复：{{ reply.originalContent }}</p>
            <p>{{ reply.content }}</p>
          </article>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">全部留言</h2>
        <div v-if="messages.length" class="message-list">
          <article v-for="msg in messages" :key="msg.id" class="card message">
            <div class="meta">
              <div class="author">
                <img v-if="msg.senderAvatar" :src="msg.senderAvatar" alt="" class="avatar" />
                <strong>{{ msg.senderNickname || '访客' }}</strong>
              </div>
              <span class="muted">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <p>{{ msg.content }}</p>
            <div class="actions">
              <button type="button" class="btn btn-ghost" @click="toggleLike(msg)">
                {{ isLiked(msg) ? '已赞' : '点赞' }} · {{ msg.likeCount }}
              </button>
              <button type="button" class="btn btn-ghost report" @click="openReport(msg)">举报</button>
            </div>
          </article>
        </div>
        <p v-else class="muted empty">还没有公开留言，来抢沙发吧</p>
        <div v-if="messages.length && hasMoreMessages" class="load-more-wrap">
          <button type="button" class="btn btn-ghost" :disabled="loadingMore" @click="loadMoreMessages">
            {{ loadingMore ? '加载中...' : '加载更多留言' }}
          </button>
        </div>
      </section>
    </template>

    <template v-else>
      <section class="section">
        <h2 class="section-title">我发出的私信</h2>
        <div v-if="sentPrivateMessages.length" class="message-list">
          <article v-for="msg in sentPrivateMessages" :key="msg.id" class="card message sent">
            <div class="meta">
              <div class="author">
                <strong>我</strong>
                <span class="badge" :class="msg.hasReply ? 'replied' : 'pending'">
                  {{ msg.hasReply ? '已回复' : '待回复' }}
                </span>
              </div>
              <span class="muted">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <p>{{ msg.content }}</p>
          </article>
        </div>
        <p v-else class="muted empty">还没有发出过私密留言</p>
      </section>

      <section class="section">
        <h2 class="section-title">博主回复我的私信</h2>
        <div v-if="privateReplies.length" class="message-list">
          <article v-for="reply in privateReplies" :key="reply.id" class="card message reply">
            <div class="meta">
              <div class="author">
                <img v-if="reply.streamerAvatar" :src="reply.streamerAvatar" alt="" class="avatar" />
                <strong>{{ reply.streamerNickname || '博主' }}</strong>
              </div>
              <span class="muted">{{ formatDateTime(reply.createdAt) }}</span>
            </div>
            <p v-if="reply.originalContent" class="quote muted">你的留言：{{ reply.originalContent }}</p>
            <p>{{ reply.content }}</p>
          </article>
        </div>
        <p v-else class="muted empty">暂无博主回复。发送上方私密留言后，博主回复会显示在这里。</p>
      </section>
    </template>

    <div v-if="reportTarget" class="modal-mask" @click.self="closeReport">
      <form class="card modal" @submit.prevent="submitReport">
        <h2>举报留言</h2>
        <p class="muted quote">{{ reportTarget.content }}</p>
        <label>
          举报原因 *
          <textarea v-model="reportReason" rows="3" maxlength="200" placeholder="请说明举报原因" required />
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeReport">取消</button>
          <button type="submit" class="btn btn-primary">提交举报</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem;
}

.intro {
  margin: 0.25rem 0 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  color: var(--text-muted);
}

.tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.compose {
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  resize: vertical;
}

.compose-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  font-size: 0.8125rem;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message {
  padding: 1rem;
}

.message.reply {
  border-left: 3px solid var(--primary);
}

.message.sent {
  border-left: 3px solid #94a3b8;
}

.badge.replied {
  background: #dcfce7;
  color: #166534;
}

.badge.pending {
  background: #f1f5f9;
  color: #64748b;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: #eef2ff;
  color: var(--primary);
}

.quote {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.report {
  color: var(--text-muted);
}

.empty {
  text-align: center;
  padding: 2rem 1rem;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.success {
  color: #16a34a;
  margin-bottom: 0.75rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
