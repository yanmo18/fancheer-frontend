<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as messagesApi from '@/api/messages'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/AppModal.vue'
import { usePagePoll } from '@/composables/usePagePoll'
import { isRateLimitMessage, useCooldown } from '@/composables/useCooldown'
import type { MessageItem, PrivateReplyItem, PublicReplyItem, SentPrivateMessageItem } from '@/types/api'
import { formatDateTime } from '@/utils/datetime'
import { mergeByIdNewestFirst } from '@/utils/listMerge'
import { resolveMediaUrl } from '@/utils/mediaUrl'

type Tab = 'public' | 'private'

const auth = useAuthStore()
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
const cooldown = useCooldown()
const error = ref('')
const success = ref('')

const PAGE_SIZE = 20
const REPLY_PAGE_SIZE = 10
const POLL_MS = 3000
const SEND_COOLDOWN_MS = 20_000
const LIKE_DEBOUNCE_MS = 300
const LIKE_THROTTLE_MS = 1000
const inflightLikeIds = new Set<string>()
/** 点赞按钮禁用（防抖/请求中/节流），用新 Set 赋值以触发模板更新 */
const likeUiLocked = ref(new Set<string>())
const poppingLikeIds = ref(new Set<string>())
const likeDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
const likeThrottleUntil = new Map<string, number>()

function isLikeUiLocked(msg: MessageItem) {
  return likeUiLocked.value.has(String(msg.id))
}

function setLikeUiLocked(id: string, locked: boolean) {
  const next = new Set(likeUiLocked.value)
  if (locked) next.add(id)
  else next.delete(id)
  likeUiLocked.value = next
}

const canUsePrivateTab = computed(() => auth.role === 'fan')

const reportTarget = ref<MessageItem | null>(null)
const reportReason = ref('')

const hasMorePublicReplies = ref(false)
const loadingMoreReplies = ref(false)
const privateRepliesPage = ref(1)
const sentPrivatePage = ref(1)
const hasMorePrivateReplies = ref(false)
const hasMoreSentPrivate = ref(false)
const loadingMorePrivate = ref(false)
const loadingMoreSent = ref(false)

function isLiked(msg: MessageItem) {
  return msg.isLiked ?? msg.liked ?? false
}

function beforeCursor(items: MessageItem[]) {
  const last = items[items.length - 1]
  return last ? String(last.id) : undefined
}

function replyBeforeCursor(items: PublicReplyItem[]) {
  const last = items[items.length - 1]
  return last ? String(last.id) : undefined
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
      publicReplies.value = await messagesApi.getPublicReplies({ limit: REPLY_PAGE_SIZE })
      hasMorePublicReplies.value = publicReplies.value.length >= REPLY_PAGE_SIZE
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

async function loadMorePublicReplies() {
  if (!hasMorePublicReplies.value || loadingMoreReplies.value || !publicReplies.value.length) return
  loadingMoreReplies.value = true
  error.value = ''
  try {
    const batch = await messagesApi.getPublicReplies({
      before: replyBeforeCursor(publicReplies.value),
      limit: REPLY_PAGE_SIZE,
    })
    publicReplies.value = [...publicReplies.value, ...batch]
    hasMorePublicReplies.value = batch.length >= REPLY_PAGE_SIZE
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载更多回复失败'
  } finally {
    loadingMoreReplies.value = false
  }
}

async function loadPrivate(reset = true) {
  if (reset) {
    loading.value = true
    privateRepliesPage.value = 1
    sentPrivatePage.value = 1
  }
  error.value = ''
  try {
    const [replies, sent] = await Promise.all([
      messagesApi.getPrivateReplies(privateRepliesPage.value, PAGE_SIZE),
      messagesApi.getSentPrivateMessages(sentPrivatePage.value, PAGE_SIZE),
    ])
    if (reset) {
      privateReplies.value = replies.list
      sentPrivateMessages.value = sent.list
    }
    hasMorePrivateReplies.value = privateRepliesPage.value < replies.pagination.totalPages
    hasMoreSentPrivate.value = sentPrivatePage.value < sent.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    if (reset) loading.value = false
  }
}

async function loadMorePrivateReplies() {
  if (!hasMorePrivateReplies.value || loadingMorePrivate.value) return
  loadingMorePrivate.value = true
  error.value = ''
  try {
    privateRepliesPage.value += 1
    const replies = await messagesApi.getPrivateReplies(privateRepliesPage.value, PAGE_SIZE)
    privateReplies.value = [...privateReplies.value, ...replies.list]
    hasMorePrivateReplies.value = privateRepliesPage.value < replies.pagination.totalPages
  } catch (e) {
    privateRepliesPage.value -= 1
    error.value = e instanceof Error ? e.message : '加载更多回复失败'
  } finally {
    loadingMorePrivate.value = false
  }
}

async function loadMoreSentPrivate() {
  if (!hasMoreSentPrivate.value || loadingMoreSent.value) return
  loadingMoreSent.value = true
  error.value = ''
  try {
    sentPrivatePage.value += 1
    const sent = await messagesApi.getSentPrivateMessages(sentPrivatePage.value, PAGE_SIZE)
    sentPrivateMessages.value = [...sentPrivateMessages.value, ...sent.list]
    hasMoreSentPrivate.value = sentPrivatePage.value < sent.pagination.totalPages
  } catch (e) {
    sentPrivatePage.value -= 1
    error.value = e instanceof Error ? e.message : '加载更多私信失败'
  } finally {
    loadingMoreSent.value = false
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

async function refreshAfterSend() {
  error.value = ''
  try {
    if (tab.value === 'public') {
      const [msgList, replies] = await Promise.all([
        messagesApi.getPublicMessages({ limit: PAGE_SIZE }),
        messagesApi.getPublicReplies({ limit: REPLY_PAGE_SIZE }),
      ])
      messages.value = msgList
      hasMoreMessages.value = msgList.length >= PAGE_SIZE
      publicReplies.value = replies
      hasMorePublicReplies.value = replies.length >= REPLY_PAGE_SIZE
    } else {
      privateRepliesPage.value = 1
      sentPrivatePage.value = 1
      const [replies, sent] = await Promise.all([
        messagesApi.getPrivateReplies(1, PAGE_SIZE),
        messagesApi.getSentPrivateMessages(1, PAGE_SIZE),
      ])
      privateReplies.value = replies.list
      sentPrivateMessages.value = sent.list
      hasMorePrivateReplies.value = replies.pagination.totalPages > 1
      hasMoreSentPrivate.value = sent.pagination.totalPages > 1
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '刷新失败'
  }
}

async function silentRefresh() {
  if (
    loading.value ||
    loadingMore.value ||
    loadingMoreReplies.value ||
    loadingMorePrivate.value ||
    loadingMoreSent.value ||
    sending.value
  ) {
    return
  }

  try {
    if (tab.value === 'public') {
      const [msgList, replies] = await Promise.all([
        messagesApi.getPublicMessages({ limit: PAGE_SIZE }),
        messagesApi.getPublicReplies({ limit: REPLY_PAGE_SIZE }),
      ])
      messages.value = mergeByIdNewestFirst(messages.value, msgList, (id) => inflightLikeIds.has(id))
      publicReplies.value = mergeByIdNewestFirst(publicReplies.value, replies)
    } else {
      const [replies, sent] = await Promise.all([
        messagesApi.getPrivateReplies(1, PAGE_SIZE),
        messagesApi.getSentPrivateMessages(1, PAGE_SIZE),
      ])
      privateReplies.value = mergeByIdNewestFirst(privateReplies.value, replies.list)
      sentPrivateMessages.value = mergeByIdNewestFirst(sentPrivateMessages.value, sent.list)
    }
  } catch {
    /* 轮询失败不打断当前页面 */
  }
}

async function send() {
  if (!content.value.trim() || cooldown.left > 0) return
  sending.value = true
  error.value = ''
  success.value = ''
  try {
    await messagesApi.sendMessage(content.value.trim(), tab.value)
    content.value = ''
    success.value = tab.value === 'public' ? '留言已发布' : '私密留言已发送，博主回复后会显示在这里'
    cooldown.start(SEND_COOLDOWN_MS)
    await refreshAfterSend()
  } catch (e) {
    const message = e instanceof Error ? e.message : '发送失败'
    error.value = message
    if (isRateLimitMessage(message)) cooldown.start(SEND_COOLDOWN_MS)
  } finally {
    sending.value = false
  }
}

async function runToggleLike(msg: MessageItem) {
  const id = String(msg.id)
  const prevLiked = isLiked(msg)
  const prevCount = msg.likeCount
  inflightLikeIds.add(id)

  if (prevLiked) {
    msg.isLiked = false
    msg.liked = false
    msg.likeCount = Math.max(0, prevCount - 1)
  } else {
    msg.isLiked = true
    msg.liked = true
    msg.likeCount = prevCount + 1
  }

  try {
    if (prevLiked) {
      await messagesApi.unlikeMessage(msg.id)
    } else {
      await messagesApi.likeMessage(msg.id)
      poppingLikeIds.value = new Set(poppingLikeIds.value).add(id)
      window.setTimeout(() => {
        const next = new Set(poppingLikeIds.value)
        next.delete(id)
        poppingLikeIds.value = next
      }, 420)
    }
  } catch (e) {
    msg.isLiked = prevLiked
    msg.liked = prevLiked
    msg.likeCount = prevCount
    error.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    inflightLikeIds.delete(id)
    setLikeUiLocked(id, false)
  }
}

/** 点击立即禁用；300ms 防抖合并连点；成功发起后 1s 内再点无效 */
function toggleLike(msg: MessageItem) {
  const id = String(msg.id)
  if (inflightLikeIds.has(id)) return
  if (Date.now() < (likeThrottleUntil.get(id) ?? 0)) return

  setLikeUiLocked(id, true)

  const pending = likeDebounceTimers.get(id)
  if (pending) clearTimeout(pending)

  likeDebounceTimers.set(
    id,
    setTimeout(() => {
      likeDebounceTimers.delete(id)
      likeThrottleUntil.set(id, Date.now() + LIKE_THROTTLE_MS)
      void runToggleLike(msg)
    }, LIKE_DEBOUNCE_MS),
  )
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

watch(canUsePrivateTab, (allowed) => {
  if (!allowed && tab.value === 'private') {
    tab.value = 'public'
  }
})

onMounted(load)
onBeforeUnmount(() => {
  for (const timer of likeDebounceTimers.values()) clearTimeout(timer)
  likeDebounceTimers.clear()
})
usePagePoll(silentRefresh, POLL_MS)
</script>

<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="chat-header-title">聊天室</div>
      <div class="chat-header-desc">公开消息全员可见 · 私密消息仅博主可见 · 停留本页时约 3 秒刷新</div>
    </div>

    <div class="chat-mode-tabs">
      <button type="button" class="chat-mode-btn" :class="{ active: tab === 'public' }" @click="tab = 'public'">
        <span class="chat-mode-dot" />公开留言
      </button>
      <button
        v-if="canUsePrivateTab"
        type="button"
        class="chat-mode-btn"
        :class="{ active: tab === 'private' }"
        @click="tab = 'private'"
      >
        <span class="chat-mode-dot" />私信博主
      </button>
    </div>

    <p v-if="success" class="success chat-flash">{{ success }}</p>
    <p v-if="error" class="error chat-flash">{{ error }}</p>
    <p v-if="loading" class="muted chat-flash">加载中...</p>

    <div class="chat-messages-area">
      <template v-if="tab === 'public'">
        <article v-for="reply in publicReplies" :key="reply.id" class="chat-bubble">
          <div class="chat-bubble-avatar">
            <img v-if="reply.streamerAvatar" :src="resolveMediaUrl(reply.streamerAvatar)" alt="" class="bubble-avatar-img" />
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

        <div v-if="publicReplies.length && hasMorePublicReplies" class="chat-load-more">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loadingMoreReplies" @click="loadMorePublicReplies">
            {{ loadingMoreReplies ? '加载中...' : '加载更多博主回复' }}
          </button>
        </div>

        <article v-for="msg in messages" :key="msg.id" class="chat-bubble">
          <div class="chat-bubble-avatar">
            <img v-if="msg.senderAvatar" :src="resolveMediaUrl(msg.senderAvatar)" alt="" class="bubble-avatar-img" />
            <span v-else>{{ authorInitial(msg.senderNickname) }}</span>
          </div>
          <div class="chat-bubble-body">
            <div class="chat-bubble-header">
              <span class="chat-bubble-name">{{ msg.senderNickname || '访客' }}</span>
              <span class="chat-bubble-time">{{ formatDateTime(msg.createdAt) }}</span>
            </div>
            <div class="chat-bubble-text">{{ msg.content }}</div>
            <div class="chat-bubble-actions">
              <button
                type="button"
                class="chat-action"
                :class="{ liked: isLiked(msg), popping: poppingLikeIds.has(String(msg.id)) }"
                :disabled="isLikeUiLocked(msg)"
                @click="toggleLike(msg)"
              >
                {{ isLiked(msg) ? '❤️' : '🤍' }} {{ msg.likeCount }}
              </button>
              <button type="button" class="chat-action" @click="openReport(msg)">⚑ 举报</button>
            </div>
          </div>
        </article>

        <p v-if="!messages.length && !publicReplies.length" class="muted chat-empty">
          还没有公开留言
          <span class="chat-empty-hint">写下第一条，给博主打个招呼吧</span>
        </p>
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
            <img v-if="reply.streamerAvatar" :src="resolveMediaUrl(reply.streamerAvatar)" alt="" class="bubble-avatar-img" />
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
          还没有私密留言
          <span class="chat-empty-hint">只有博主能看到，适合说悄悄话</span>
        </p>
        <div v-if="hasMoreSentPrivate" class="chat-load-more">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loadingMoreSent" @click="loadMoreSentPrivate">
            {{ loadingMoreSent ? '加载中...' : '加载更多已发送私信' }}
          </button>
        </div>
        <div v-if="hasMorePrivateReplies" class="chat-load-more">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loadingMorePrivate" @click="loadMorePrivateReplies">
            {{ loadingMorePrivate ? '加载中...' : '加载更多博主回复' }}
          </button>
        </div>
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
        <button type="submit" class="chat-send-btn" :disabled="sending || cooldown.left > 0">
          {{ sending ? '...' : cooldown.left > 0 ? `${cooldown.left}s` : '发送' }}
        </button>
      </div>
      <div class="chat-input-footer">
        <span class="chat-char-count">{{ content.length }}/500</span>
        <span class="chat-cooldown-text">{{
          cooldown.left > 0
            ? `发送冷却 ${cooldown.left} 秒`
            : tab === 'public'
              ? '公开可见'
              : '仅博主可见'
        }}</span>
      </div>
    </form>

    <AppModal v-if="reportTarget" :open="true" title-id="report-modal-title" @close="closeReport">
      <form class="auth-card modal-card" @submit.prevent="submitReport">
        <h2 id="report-modal-title" class="modal-title">举报留言</h2>
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
    </AppModal>
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
  display: grid;
  gap: 0.4rem;
}

.chat-empty-hint {
  display: block;
  font-size: 0.8125rem;
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
