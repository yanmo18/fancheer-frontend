<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as graphApi from '@/api/admin/graph'
import type { AdminGraphCharacter, AdminGraphRelation } from '@/api/admin/graph'
import ImageUpload from '@/components/admin/ImageUpload.vue'

const tab = ref<'characters' | 'relations'>('characters')

const charList = ref<AdminGraphCharacter[]>([])
const charPage = ref(1)
const charTotalPages = ref(1)
const relList = ref<AdminGraphRelation[]>([])
const relPage = ref(1)
const relTotalPages = ref(1)
const allCharacters = ref<AdminGraphCharacter[]>([])

const loading = ref(false)
const error = ref('')
const message = ref('')

const showCharForm = ref(false)
const editingCharId = ref<string | null>(null)
const charForm = reactive({
  name: '',
  avatarUrl: '',
  bio: '',
  isCenter: false,
  sortOrder: 0,
})

const showRelForm = ref(false)
const editingRelId = ref<string | null>(null)
const relForm = reactive({
  fromCharacterId: '',
  toCharacterId: '',
  relationLabel: '',
  sortOrder: 0,
})

function charName(id: string) {
  return allCharacters.value.find((c) => c.id === id)?.name ?? id
}

function resetCharForm() {
  editingCharId.value = null
  charForm.name = ''
  charForm.avatarUrl = ''
  charForm.bio = ''
  charForm.isCenter = false
  charForm.sortOrder = 0
}

function resetRelForm() {
  editingRelId.value = null
  relForm.fromCharacterId = ''
  relForm.toCharacterId = ''
  relForm.relationLabel = ''
  relForm.sortOrder = 0
}

async function loadCharacters() {
  loading.value = true
  error.value = ''
  try {
    const data = await graphApi.getAdminCharacters(charPage.value)
    charList.value = data.list
    charTotalPages.value = data.pagination.totalPages
    allCharacters.value = await graphApi.getAllCharacters()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载人物失败'
  } finally {
    loading.value = false
  }
}

async function loadRelations() {
  loading.value = true
  error.value = ''
  try {
    const data = await graphApi.getAdminRelations(relPage.value)
    relList.value = data.list
    relTotalPages.value = data.pagination.totalPages
    if (!allCharacters.value.length) {
      allCharacters.value = await graphApi.getAllCharacters()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载关系失败'
  } finally {
    loading.value = false
  }
}

async function loadCurrentTab() {
  if (tab.value === 'characters') {
    await loadCharacters()
  } else {
    await loadRelations()
  }
}

function switchTab(next: 'characters' | 'relations') {
  tab.value = next
  message.value = ''
  error.value = ''
  loadCurrentTab()
}

function openCreateChar() {
  resetCharForm()
  showCharForm.value = true
}

function openEditChar(item: AdminGraphCharacter) {
  editingCharId.value = item.id
  charForm.name = item.name
  charForm.avatarUrl = item.avatarUrl || ''
  charForm.bio = item.bio || ''
  charForm.isCenter = item.isCenter
  charForm.sortOrder = item.sortOrder
  showCharForm.value = true
}

function closeCharForm() {
  showCharForm.value = false
  resetCharForm()
}

async function submitChar() {
  if (!charForm.name.trim()) {
    error.value = '请填写人物名称'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = {
      name: charForm.name.trim(),
      avatarUrl: charForm.avatarUrl,
      bio: charForm.bio,
      isCenter: charForm.isCenter,
      sortOrder: Number(charForm.sortOrder),
    }
    if (editingCharId.value) {
      await graphApi.updateCharacter(editingCharId.value, payload)
      message.value = '人物已更新'
    } else {
      await graphApi.createCharacter(payload)
      message.value = '人物已创建'
    }
    closeCharForm()
    await loadCharacters()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    loading.value = false
  }
}

async function removeChar(id: string) {
  if (!confirm('删除人物将同时删除相关关系，确定继续？')) return
  loading.value = true
  error.value = ''
  try {
    await graphApi.deleteCharacter(id)
    message.value = '已删除人物'
    await loadCharacters()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    loading.value = false
  }
}

function openCreateRel() {
  resetRelForm()
  showRelForm.value = true
}

function openEditRel(item: AdminGraphRelation) {
  editingRelId.value = item.id
  relForm.fromCharacterId = item.fromCharacterId
  relForm.toCharacterId = item.toCharacterId
  relForm.relationLabel = item.relationLabel
  relForm.sortOrder = item.sortOrder
  showRelForm.value = true
}

function closeRelForm() {
  showRelForm.value = false
  resetRelForm()
}

async function submitRel() {
  if (!relForm.fromCharacterId || !relForm.toCharacterId) {
    error.value = '请选择起始和目标人物'
    return
  }
  if (relForm.fromCharacterId === relForm.toCharacterId) {
    error.value = '起始和目标不能是同一个人物'
    return
  }
  if (!relForm.relationLabel.trim()) {
    error.value = '请填写关系标签'
    return
  }
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const payload = {
      fromCharacterId: relForm.fromCharacterId,
      toCharacterId: relForm.toCharacterId,
      relationLabel: relForm.relationLabel.trim(),
      sortOrder: Number(relForm.sortOrder),
    }
    if (editingRelId.value) {
      await graphApi.updateRelation(editingRelId.value, payload)
      message.value = '关系已更新'
    } else {
      await graphApi.createRelation(payload)
      message.value = '关系已创建'
    }
    closeRelForm()
    await loadRelations()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    loading.value = false
  }
}

async function removeRel(id: string) {
  if (!confirm('确定删除这条关系？')) return
  loading.value = true
  error.value = ''
  try {
    await graphApi.deleteRelation(id)
    message.value = '已删除关系'
    await loadRelations()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    loading.value = false
  }
}

function prevCharPage() {
  if (charPage.value > 1) {
    charPage.value -= 1
    loadCharacters()
  }
}

function nextCharPage() {
  if (charPage.value < charTotalPages.value) {
    charPage.value += 1
    loadCharacters()
  }
}

function prevRelPage() {
  if (relPage.value > 1) {
    relPage.value -= 1
    loadRelations()
  }
}

function nextRelPage() {
  if (relPage.value < relTotalPages.value) {
    relPage.value += 1
    loadRelations()
  }
}

onMounted(loadCharacters)
</script>

<template>
  <div class="graph-admin">
    <header class="page-header">
      <div>
        <h1>关系图谱</h1>
        <p class="muted">管理首页展示的人物节点与关系连线</p>
      </div>
      <button
        v-if="tab === 'characters'"
        type="button"
        class="btn btn-primary"
        @click="openCreateChar"
      >
        新增人物
      </button>
      <button
        v-else
        type="button"
        class="btn btn-primary"
        @click="openCreateRel"
        :disabled="allCharacters.length < 2"
      >
        新增关系
      </button>
    </header>

    <div class="tabs">
      <button
        type="button"
        class="tab"
        :class="{ active: tab === 'characters' }"
        @click="switchTab('characters')"
      >
        人物
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: tab === 'relations' }"
        @click="switchTab('relations')"
      >
        关系
      </button>
    </div>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="tab === 'characters'">
      <div v-if="loading && !charList.length" class="muted">加载中...</div>
      <div v-else class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>头像</th>
              <th>名称</th>
              <th>简介</th>
              <th>中心</th>
              <th>排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in charList" :key="item.id">
              <td>
                <img v-if="item.avatarUrl" :src="item.avatarUrl" alt="" class="thumb" />
                <span v-else class="muted">—</span>
              </td>
              <td>{{ item.name }}</td>
              <td class="bio-cell">{{ item.bio || '—' }}</td>
              <td>{{ item.isCenter ? '是' : '否' }}</td>
              <td>{{ item.sortOrder }}</td>
              <td class="actions">
                <button type="button" class="btn btn-ghost" @click="openEditChar(item)">编辑</button>
                <button type="button" class="btn btn-ghost danger" @click="removeChar(item.id)">删除</button>
              </td>
            </tr>
            <tr v-if="!charList.length">
              <td colspan="6" class="muted center">暂无人物，请先新增</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="charTotalPages > 1" class="pager">
        <button type="button" class="btn btn-ghost" :disabled="charPage <= 1" @click="prevCharPage">上一页</button>
        <span class="muted">{{ charPage }} / {{ charTotalPages }}</span>
        <button type="button" class="btn btn-ghost" :disabled="charPage >= charTotalPages" @click="nextCharPage">下一页</button>
      </div>
    </div>

    <div v-else>
      <p v-if="allCharacters.length < 2" class="muted hint">至少需要 2 个人物才能创建关系</p>
      <div v-if="loading && !relList.length" class="muted">加载中...</div>
      <div v-else class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>起始人物</th>
              <th>关系</th>
              <th>目标人物</th>
              <th>排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in relList" :key="item.id">
              <td>{{ charName(item.fromCharacterId) }}</td>
              <td>{{ item.relationLabel }}</td>
              <td>{{ charName(item.toCharacterId) }}</td>
              <td>{{ item.sortOrder }}</td>
              <td class="actions">
                <button type="button" class="btn btn-ghost" @click="openEditRel(item)">编辑</button>
                <button type="button" class="btn btn-ghost danger" @click="removeRel(item.id)">删除</button>
              </td>
            </tr>
            <tr v-if="!relList.length">
              <td colspan="5" class="muted center">暂无关系</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="relTotalPages > 1" class="pager">
        <button type="button" class="btn btn-ghost" :disabled="relPage <= 1" @click="prevRelPage">上一页</button>
        <span class="muted">{{ relPage }} / {{ relTotalPages }}</span>
        <button type="button" class="btn btn-ghost" :disabled="relPage >= relTotalPages" @click="nextRelPage">下一页</button>
      </div>
    </div>

    <div v-if="showCharForm" class="modal-mask" @click.self="closeCharForm">
      <form class="card modal" @submit.prevent="submitChar">
        <h2>{{ editingCharId ? '编辑人物' : '新增人物' }}</h2>
        <label>
          名称 *
          <input v-model="charForm.name" maxlength="50" required />
        </label>
        <ImageUpload v-model="charForm.avatarUrl" category="graph" />
        <label>
          简介
          <textarea v-model="charForm.bio" rows="3" maxlength="500" />
        </label>
        <label>
          排序（越大越靠前）
          <input v-model.number="charForm.sortOrder" type="number" />
        </label>
        <label class="checkbox">
          <input v-model="charForm.isCenter" type="checkbox" />
          设为中心节点（首页图谱中心）
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeCharForm">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">保存</button>
        </div>
      </form>
    </div>

    <div v-if="showRelForm" class="modal-mask" @click.self="closeRelForm">
      <form class="card modal" @submit.prevent="submitRel">
        <h2>{{ editingRelId ? '编辑关系' : '新增关系' }}</h2>
        <label>
          起始人物 *
          <select v-model="relForm.fromCharacterId" required>
            <option value="">请选择</option>
            <option v-for="c in allCharacters" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>
        <label>
          关系标签 *
          <input v-model="relForm.relationLabel" maxlength="50" placeholder="如：好友、搭档" required />
        </label>
        <label>
          目标人物 *
          <select v-model="relForm.toCharacterId" required>
            <option value="">请选择</option>
            <option v-for="c in allCharacters" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>
        <label>
          排序（越大越靠前）
          <input v-model.number="relForm.sortOrder" type="number" />
        </label>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeRelForm">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">保存</button>
        </div>
      </form>
    </div>
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

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.375rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
}

.tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.hint {
  margin-bottom: 0.75rem;
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

.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 50%;
}

.bio-cell {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
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

label {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

input,
select,
textarea {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}

.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.success {
  color: #16a34a;
  margin-bottom: 0.5rem;
}
</style>
