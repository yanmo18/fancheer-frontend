<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as checkinApi from '@/api/checkin'
import { buildMonthGrid, getTodayKey, shiftMonth } from '@/utils/calendar'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const checkedDates = ref<string[]>([])
const loading = ref(false)
const checking = ref(false)
const message = ref('')
const error = ref('')

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const todayKey = getTodayKey()

const monthLabel = computed(() => `${year.value} 年 ${month.value} 月`)
const calendarCells = computed(() => buildMonthGrid(year.value, month.value))
const checkedSet = computed(() => new Set(checkedDates.value))
const checkedCount = computed(() => checkedDates.value.length)
const checkedToday = computed(() => checkedSet.value.has(todayKey))
const isCurrentMonth = computed(
  () => year.value === now.getFullYear() && month.value === now.getMonth() + 1,
)

function isChecked(date: string) {
  return checkedSet.value.has(date)
}

function isToday(date: string) {
  return date === todayKey
}

function isFuture(date: string) {
  return date > todayKey
}

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
  checking.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await checkinApi.checkin()
    message.value = res.message
    if (!isCurrentMonth.value) {
      year.value = now.getFullYear()
      month.value = now.getMonth() + 1
    }
    await loadCalendar()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '打卡失败'
  } finally {
    checking.value = false
  }
}

function changeMonth(delta: number) {
  const next = shiftMonth(year.value, month.value, delta)
  year.value = next.year
  month.value = next.month
  loadCalendar()
}

onMounted(loadCalendar)
</script>

<template>
  <div class="user-page checkin-page">
    <div class="user-card user-card-full">
      <h2 class="user-card-title"><span class="user-card-title-icon">📅</span>每日打卡</h2>
      <p class="muted checkin-desc">记录你来访的每一天</p>

      <button
        type="button"
        class="user-btn user-btn-primary checkin-btn"
        :disabled="checking || loading || checkedToday"
        @click="doCheckin"
      >
        {{ checkedToday ? '今日已打卡' : checking ? '打卡中...' : '今日打卡' }}
      </button>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="user-card user-card-full calendar-card">
      <div class="calendar-head">
        <button type="button" class="btn btn-ghost month-btn" @click="changeMonth(-1)">‹</button>
        <div class="month-title">
          <strong>{{ monthLabel }}</strong>
          <span class="muted">本月已打卡 {{ checkedCount }} 天</span>
        </div>
        <button type="button" class="btn btn-ghost month-btn" @click="changeMonth(1)">›</button>
      </div>

      <p v-if="loading" class="muted center">加载中...</p>

      <div v-else class="calendar">
        <div class="weekdays">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>
        <div class="days">
          <div
            v-for="(cell, index) in calendarCells"
            :key="`${cell.date ?? 'empty'}-${index}`"
            class="day-cell"
            :class="{
              empty: !cell.date,
              checked: cell.date && isChecked(cell.date),
              today: cell.date && isToday(cell.date),
              future: cell.date && isFuture(cell.date),
            }"
          >
            <span v-if="cell.day">{{ cell.day }}</span>
          </div>
        </div>
      </div>

      <div class="legend">
        <span><i class="dot checked" />已打卡</span>
        <span><i class="dot today" />今天</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkin-page {
  max-width: 520px;
}

.checkin-desc {
  margin: -0.5rem 0 1rem;
}

.checkin-btn {
  align-self: flex-start;
}

.calendar-card {
  margin-top: 1.5rem;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.month-title {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.month-title strong {
  font-size: 1rem;
}

.month-title .muted {
  font-size: 0.8125rem;
}

.month-btn {
  min-width: 36px;
  padding: 0.375rem 0.625rem;
  font-size: 1.25rem;
  line-height: 1;
}

.calendar {
  user-select: none;
}

.weekdays,
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;
}

.weekdays {
  margin-bottom: 0.375rem;
}

.weekdays span {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.day-cell.empty {
  background: transparent;
}

.day-cell.checked {
  background: rgba(125, 159, 122, 0.15);
  color: var(--success);
  font-weight: 700;
}

.day-cell.today {
  box-shadow: inset 0 0 0 2px var(--accent-primary);
}

.day-cell.future:not(.checked) {
  color: var(--text-muted);
}

.legend {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot.checked {
  background: rgba(125, 159, 122, 0.2);
  box-shadow: inset 0 0 0 2px var(--success);
}

.dot.today {
  background: var(--bg-card);
  box-shadow: inset 0 0 0 2px var(--accent-primary);
}

.center {
  text-align: center;
  padding: 1rem 0;
}

.success {
  color: #16a34a;
}
</style>
