<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as userApi from '@/api/admin/user'
import type { AdminUserItem } from '@/api/admin/user'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/datetime'
import type { UserRole } from '@/types/api'
import AppModal from '@/components/AppModal.vue'

const auth = useAuthStore()

const list = ref<AdminUserItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')
const message = ref('')

const filterRole = ref('')
const filterStatus = ref('')
const keyword = ref('')

const roleLabels: Record<UserRole, string> = {
  fan: '粉丝',
  admin: '管理员',
  streamer: '博主',
}

const statusLabels = {
  active: '正常',
  banned: '已封禁',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await userApi.getAdminUsers({
      page: page.value,
      role: filterRole.value || undefined,
      status: filterStatus.value || undefined,
      keyword: keyword.value.trim() || undefined,
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

const showBanForm = ref(false)
const banTarget = ref<AdminUserItem | null>(null)
const banRemark = ref('')

function openBanForm(item: AdminUserItem) {
  banTarget.value = item
  banRemark.value = ''
  showBanForm.value = true
}

function closeBanForm() {
  showBanForm.value = false
  banTarget.value = null
  banRemark.value = ''
}

async function toggleBan(item: AdminUserItem) {
  const isBanned = item.status === 'banned'
  if (isBanned) {
    if (!confirm(`确定解封用户「${item.nickname}」？`)) return
    loading.value = true
    error.value = ''
    message.value = ''
    try {
      await userApi.unbanUser(item.id)
      message.value = '已解封'
      await load()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '解封失败'
    } finally {
      loading.value = false
    }
    return
  }
  openBanForm(item)
}

async function submitBan() {
  if (!banTarget.value) return
  const remark = banRemark.value.trim()
  if (!remark) {
    error.value = '请填写封禁备注'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await userApi.banUser(banTarget.value.id, remark)
    message.value = '已封禁'
    closeBanForm()
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '封禁失败'
  } finally {
    loading.value = false
  }
}

async function toggleAdmin(item: AdminUserItem) {
  const makeAdmin = item.role === 'fan'
  const action = makeAdmin ? '设为协管员' : '取消协管员'
  if (!confirm(`确定${action}「${item.nickname}」？`)) return

  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await userApi.updateUserRole(item.id, makeAdmin ? 'admin' : 'fan')
    message.value = makeAdmin ? '已设为协管员' : '已取消协管员'
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    loading.value = false
  }
}

function canBan(item: AdminUserItem) {
  return item.role !== 'admin' && item.role !== 'streamer'
}

function canManageRole(item: AdminUserItem) {
  return auth.hasRole(['streamer']) && item.role !== 'streamer'
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

watch([filterRole, filterStatus], () => {
  page.value = 1
  load()
})

onMounted(load)
</script>

<template>
  <div class="user-admin">
    <header class="page-header">
      <div>
        <h1>用户管理</h1>
        <p class="muted">查看注册用户，封禁 / 解封（需备注），博主可设置管理员</p>
      </div>
    </header>

    <div class="filters card">
      <input v-model="keyword" placeholder="搜索用户名 / 昵称" @keyup.enter="search" />
      <select v-model="filterRole">
        <option value="">全部角色</option>
        <option value="fan">粉丝</option>
        <option value="admin">管理员</option>
        <option value="streamer">博主</option>
      </select>
      <select v-model="filterStatus">
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="banned">已封禁</option>
      </select>
      <button type="button" class="btn btn-primary" @click="search">搜索</button>
    </div>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="loading && !list.length" class="muted">加载中...</div>

    <div v-else class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>用户名</th>
            <th>角色</th>
            <th>状态</th>
            <th>封禁备注</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>
              <div class="user-cell">
                <img v-if="item.avatar" :src="item.avatar" alt="" class="avatar" />
                <span v-else class="avatar fallback">{{ item.nickname.slice(0, 1) }}</span>
                <span>{{ item.nickname }}</span>
              </div>
            </td>
            <td>{{ item.username }}</td>
            <td>{{ roleLabels[item.role] }}</td>
            <td>
              <span :class="item.status === 'banned' ? 'badge banned' : 'badge active'">
                {{ statusLabels[item.status] }}
              </span>
            </td>
            <td class="remark-cell">{{ item.banRemark || '—' }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td class="actions">
              <button
                v-if="canBan(item)"
                type="button"
                class="btn btn-ghost"
                :class="{ danger: item.status !== 'banned' }"
                @click="toggleBan(item)"
              >
                {{ item.status === 'banned' ? '解封' : '封禁' }}
              </button>
              <button
                v-if="canManageRole(item)"
                type="button"
                class="btn btn-ghost"
                @click="toggleAdmin(item)"
              >
                {{ item.role === 'admin' ? '取消协管' : '设为协管' }}
              </button>
              <span v-if="!canBan(item) && !canManageRole(item)" class="muted">—</span>
            </td>
          </tr>
          <tr v-if="!list.length">
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

    <AppModal v-if="banTarget" :open="showBanForm" title-id="user-ban-modal-title" @close="closeBanForm">
      <form class="card modal" @submit.prevent="submitBan">
        <h2 id="user-ban-modal-title">封禁用户</h2>
        <p class="muted">用户：{{ banTarget.nickname }}（{{ banTarget.username }}）</p>
        <label>
          封禁备注 *
          <textarea
            v-model="banRemark"
            rows="3"
            maxlength="500"
            placeholder="请说明封禁原因，便于后续审计"
            required
          />
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeBanForm">取消</button>
          <button type="submit" class="btn btn-primary danger" :disabled="loading">确认封禁</button>
        </div>
      </form>
    </AppModal>
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.filters input,
.filters select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

.filters input {
  flex: 1;
  min-width: 160px;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar.fallback {
  display: grid;
  place-items: center;
  background: #e0e7ff;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.badge.active {
  background: #dcfce7;
  color: #166534;
}

.badge.banned {
  background: #fee2e2;
  color: #991b1b;
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

.remark-cell {
  max-width: 180px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  word-break: break-word;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  width: min(100%, 420px);
  padding: 1.25rem;
}

.modal label {
  display: block;
  margin-top: 1rem;
}

.modal textarea {
  width: 100%;
  margin-top: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.success {
  color: #16a34a;
  margin-bottom: 0.5rem;
}
</style>
