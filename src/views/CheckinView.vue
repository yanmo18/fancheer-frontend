<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as checkinApi from '@/api/checkin'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const checkedDates = ref<string[]>([])
const loading = ref(false)
const message = ref('')
const error = ref('')

async function loadCalendar() {
  loading.value = true
  error.value = ''
  try {
    const data = await checkinApi.getCalendar(year.value, month.value)
    checkedDates.value = data.checkedDates
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function doCheckin() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await checkinApi.checkin()
    message.value = res.message
    await loadCalendar()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '打卡失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadCalendar)
</script>

<template>
  <div class="page">
    <h1>每日打卡</h1>
    <p class="muted">记录你来访的每一天</p>

    <div class="card section">
      <button type="button" class="btn btn-primary" :disabled="loading" @click="doCheckin">
        今日打卡
      </button>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="card section">
      <h2>{{ year }} 年 {{ month }} 月</h2>
      <p v-if="loading" class="muted">加载中...</p>
      <ul v-else class="dates">
        <li v-for="d in checkedDates" :key="d">{{ d }}</li>
        <li v-if="!checkedDates.length" class="muted">本月暂无打卡记录</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem;
}

.section {
  padding: 1rem;
  margin-bottom: 1rem;
}

.dates {
  margin: 0;
  padding-left: 1.25rem;
}

.success {
  color: #16a34a;
  margin-top: 0.5rem;
}
</style>
