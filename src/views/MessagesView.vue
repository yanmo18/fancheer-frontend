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

function authorInitial(name?: string) {
  return (name || '访').slice(0, 1)
}

async function loadPublic(reset = true) {
  if (reset) loading.value = true
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
    if (reset) loading.value = false
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
  <div class="chat-page">
    <div class="chat-header">
      <div class="chat-header-title">聊天室</div>
      <div class="chat-header-desc">公开消息全员可见 · 私密消息仅博主可见</div>
    </div>

    <div class="chat-mode-tabs">
      <button type="button" class="chat-mode-btn" :class="{ active: tab === 'public' }" @click="tab = 'public'">
        <span class="chat-mode-dot" />公开留言
      </button>
      <button type="button" class="chat-mode-btn" :class="{ active: tab === 'private' }" @click="tab = 'private'">
        <span class="chat-mode-dot" />私信博主
      </button>
    </div>

    <p v-if="success" class="success chat-flash">{{ success }}</p>
    <p v-if="error" class="error chat-flash">{{ error }}</p>
    <p v-if="loading" class="muted chat-flash">加载中...</p>

    <div v-else class="chat-messages-area">
      <template v-if="tab === 'public'">
        <article v-for="reply in publicReplies" :key="reply.id" class="chat-bubble">
          <div class="chat-bubble-avatar">
            <img v-if="reply.streamerAvatar" :src="reply.streamerAvatar" alt="" class="bubble-avatar-img" />
            <span v-else>{{ authorInitial(reply.streamerNickname) }}</span>
          </div>
          <div class="chat-bubble-body">
            <span class="chat-reply-label">博主回复</span>
            <div class="chat-bubble-header">
              <span class="chat-bubble-name">{{ reply.streamerNickname || '博主' }}</span>
              <span class="chat-bubble-time">{{ formatDateTime(reply.createdAt) }}</span>
            </div>
            <p v-if="reply.originalContent" class="chat-quote muted">
              <template v-if="reply.isAnonymous">
                匿名访客的私信：{{ reply.originalContent }}
              </template>
              <template v-else>
                回复 {{ reply.originalSenderNickname || '访客' }}：{{ reply.originalContent }}
              </template>
            </p>
            <div class="chat-bubble-text">{{ reply.content }}</div>
          </div>
        </article>

        <article v-for="msg in messages" :key="msg.id" class="chat-bubble">
          <div class="chat-bubble-avatar">
            <img v-if="msg.senderAvatar" :src="msg.senderAvatar" alt="" class="bubble-avatar-img" />
            <span v-else>{{ authorInitial(msg.senderNickname) }}</span>
          </div>
          <div class="chat-bubble-body">
            <div class="chat-bubble-header">
              <span class="chat-bubble-name">{{ msg.senderNickname || '访客' }}</span>
              <span class="chat-bubble-time">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <div class="chat-bubble-text">{{ msg.content }}</div>
            <div class="chat-bubble-actions">
              <button type="button" class="chat-action" :class="{ liked: isLiked(msg) }" @click="toggleLike(msg)">
                {{ isLiked(msg) ? '❤️' : '🤍' }} {{ msg.likeCount }}
              </button>
              <button type="button" class="chat-action" @click="openReport(msg)">⚑ 举报</button>
            </div>
          </div>
        </article>

        <p v-if="!messages.length && !publicReplies.length" class="muted chat-empty">还没有留言，来抢沙发吧</p>
        <div v-if="messages.length && hasMoreMessages" class="chat-load-more">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loadingMore" @click="loadMoreMessages">
            {{ loadingMore ? '加载中...' : '加载更多留言' }}
          </button>
        </div>
      </template>

      <template v-else>
        <article v-for="msg in sentPrivateMessages" :key="`sent-${msg.id}`" class="chat-bubble">
          <div class="chat-bubble-avatar">我</div>
          <div class="chat-bubble-body">
            <span class="chat-private-label">{{ msg.hasReply ? '已回复' : '待回复' }}</span>
            <div class="chat-bubble-header">
              <span class="chat-bubble-name">我发出的私信</span>
              <span class="chat-bubble-time">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <div class="chat-bubble-text">{{ msg.content }}</div>
          </div>
        </article>

        <article v-for="reply in privateReplies" :key="reply.id" class="chat-bubble">
          <div class="chat-bubble-avatar">
            <img v-if="reply.streamerAvatar" :src="reply.streamerAvatar" alt="" class="bubble-avatar-img" />
            <span v-else>{{ authorInitial(reply.streamerNickname) }}</span>
          </div>
          <div class="chat-bubble-body">
            <span class="chat-reply-label">博主回复</span>
            <div class="chat-bubble-header">
              <span class="chat-bubble-name">{{ reply.streamerNickname || '博主' }}</span>
              <span class="chat-bubble-time">{{ formatDateTime(reply.createdAt) }}</span>
            </div>
            <p v-if="reply.originalContent" class="chat-quote muted">你的留言：{{ reply.originalContent }}</p>
            <div class="chat-bubble-text">{{ reply.content }}</div>
          </div>
        </article>

        <p v-if="!sentPrivateMessages.length && !privateReplies.length" class="muted chat-empty">
          暂无私密留言记录
        </p>
      </template>
    </div>

    <form class="chat-input-area" @submit.prevent="send">
      <div class="chat-input-row">
        <textarea
          v-model="content"
          class="chat-input"
          rows="2"
          maxlength="500"
          :placeholder="composePlaceholder"
        />
        <button type="submit" class="chat-send-btn" :disabled="sending">
          {{ sending ? '...' : '发送' }}
        </button>
      </div>
      <div class="chat-input-footer">
        <span class="chat-char-count">{{ content.length }}/500</span>
        <span class="chat-cooldown-text">{{ tab === 'public' ? '公开可见' : '仅博主可见' }}</span>
      </div>
    </form>

    <div v-if="reportTarget" class="modal-mask" @click.self="closeReport">
      <form class="auth-card modal-card" @submit.prevent="submitReport">
        <h2 class="modal-title">举报留言</h2>
        <p class="muted chat-quote">{{ reportTarget.content }}</p>
        <div class="auth-field">
          <label class="auth-label">举报原因 *</label>
          <textarea v-model="reportReason" class="auth-input" rows="3" maxlength="200" required />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="closeReport">取消</button>
          <button type="submit" class="btn btn-primary">提交举报</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.chat-mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.chat-flash {
  margin: 0 0 12px;
}

.chat-empty {
  text-align: center;
  padding: 2rem 0;
}

.chat-load-more {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0 1rem;
}

.bubble-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.chat-quote {
  font-size: 0.8125rem;
  margin: 0 0 6px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 200;
}

.modal-card {
  width: 100%;
  max-width: 420px;
}

.modal-title {
  margin: 0 0 0.75rem;
  font-family: 'Noto Serif SC', serif;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
