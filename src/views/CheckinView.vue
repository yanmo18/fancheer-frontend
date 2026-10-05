<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import * as checkinApi from '@/api/checkin'
import { buildMonthGrid, getTodayKey, shiftMonth } from '@/utils/calendar'

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const checkedDates = ref<string[]>([])
const checkedAt = ref<Record<string, string>>({})
const totalDays = ref(0)
const currentStreak = ref(0)
const loading = ref(false)
const checking = ref(false)
const message = ref('')
const error = ref('')
/** 刚打卡成功时的庆祝态，驱动按钮 / 今日格 / 统计数字动画 */
const justCheckedIn = ref(false)
const celebrateStats = ref(false)
const bumpTotal = ref(false)
const bumpStreak = ref(false)

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

function isPast(date: string) {
  return date < todayKey
}

function checkedTitle(date: string | null) {
  if (!date) return undefined
  if (isChecked(date)) {
    const at = checkedAt.value[date]
    return at ? `打卡时间 ${at}` : '已打卡'
  }
  if (isPast(date)) return '未打卡'
  if (isToday(date)) return '今天'
  return undefined
}

/** silent：刷新时不拆掉日历 DOM，避免打卡后看不到「今日变绿」过渡 */
async function loadCalendar(silent = false) {
  if (!silent) {
    loading.value = true
  }
  error.value = ''
  try {
    const data = await checkinApi.getCalendar(year.value, month.value)
    checkedDates.value = data.checkedDates
    checkedAt.value = data.checkedAt ?? {}
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

function pulseStats(totalChanged: boolean, streakChanged: boolean) {
  if (!totalChanged && !streakChanged) return
  bumpTotal.value = totalChanged
  bumpStreak.value = streakChanged
  celebrateStats.value = true
  window.setTimeout(() => {
    celebrateStats.value = false
    bumpTotal.value = false
    bumpStreak.value = false
  }, 700)
}

async function loadStats() {
  try {
    const data = await checkinApi.getStats()
    const totalChanged = data.totalDays !== totalDays.value
    const streakChanged = data.currentStreak !== currentStreak.value
    totalDays.value = data.totalDays
    currentStreak.value = data.currentStreak
    // 仅在数值真正变化时 bump，避免乐观更新后的对账清掉正在播的动画
    pulseStats(totalChanged, streakChanged)
  } catch {
    /* 日历仍可单独展示 */
  }
}

function triggerCelebrate() {
  justCheckedIn.value = true
  window.setTimeout(() => {
    justCheckedIn.value = false
  }, 1200)
}

async function doCheckin() {
  if (checking.value || checkedToday.value) return
  checking.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await checkinApi.checkin()
    message.value = res.message

    // 乐观更新：立刻让今日格 / 按钮态变化，再后台静默对账
    if (!checkedSet.value.has(todayKey)) {
      checkedDates.value = [...checkedDates.value, todayKey]
    }
    const stamp = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    checkedAt.value = {
      ...checkedAt.value,
      [todayKey]: `${todayKey} ${pad(stamp.getHours())}:${pad(stamp.getMinutes())}:${pad(stamp.getSeconds())}`,
    }
    totalDays.value += 1
    currentStreak.value += 1
    pulseStats(true, true)

    if (!isCurrentMonth.value) {
      year.value = now.getFullYear()
      month.value = now.getMonth() + 1
    }

    await nextTick()
    triggerCelebrate()

    await loadCalendar(true)
    await loadStats()
  } catch (e) {
    const msg = e instanceof Error ? e.message : '打卡失败'
    error.value = msg
    // 后端已打过但前端未标绿（常见于历史时区错位）：强制对账并标上今天
    if (msg.includes('已经打过卡')) {
      await loadCalendar(true)
      await loadStats()
      // 对账后仍缺今天：本地补标，避免「已打过但格子不绿」
      if (!checkedSet.value.has(todayKey)) {
        checkedDates.value = [...checkedDates.value, todayKey]
      }
      error.value = ''
      message.value = '今天已经打过卡了'
    }
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

onMounted(() => {
  loadCalendar()
  loadStats()
})
</script>

<template>
  <div class="user-page checkin-page">
    <div class="user-card user-card-full">
      <h2 class="user-card-title"><span class="user-card-title-icon">📅</span>每日打卡</h2>
      <p class="muted checkin-desc">记录你来访的每一天</p>

      <div
        class="checkin-stats"
        :class="{ celebrating: celebrateStats }"
        aria-label="打卡统计"
      >
        <div class="checkin-stat" :class="{ bump: bumpTotal }">
          <strong>{{ totalDays }}</strong>
          <span>累计天数</span>
        </div>
        <div class="checkin-stat" :class="{ bump: bumpStreak }">
          <strong>{{ currentStreak }}</strong>
          <span>已连续打卡 {{ currentStreak }} 天</span>
        </div>
      </div>

      <button
        type="button"
        class="user-btn user-btn-primary checkin-btn"
        :class="{
          success: checkedToday,
          celebrating: justCheckedIn,
        }"
        :disabled="checking || loading || checkedToday"
        @click="doCheckin"
      >
        <span class="checkin-btn-label">
          {{ checkedToday ? '今日已打卡' : checking ? '打卡中...' : '今日打卡' }}
        </span>
      </button>
      <p v-if="message" class="success checkin-message" :class="{ show: !!message }">
        {{ message }}
      </p>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="!loading && totalDays === 0" class="muted checkin-empty">
        还没有打卡记录，点上方按钮开始连续打卡吧
      </p>
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
              missed: cell.date && isPast(cell.date) && !isChecked(cell.date),
              today: cell.date && isToday(cell.date),
              future: cell.date && isFuture(cell.date),
              celebrate: justCheckedIn && cell.date && isToday(cell.date) && isChecked(cell.date),
            }"
            :title="checkedTitle(cell.date)"
          >
            <span v-if="cell.day" class="day-num">{{ cell.day }}</span>
          </div>
        </div>
      </div>

      <div class="legend">
        <span><i class="dot missed" />过期未打</span>
        <span><i class="dot checked" />已打卡</span>
        <span><i class="dot today" />今天</span>
        <span><i class="dot future" />未到</span>
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

.checkin-empty {
  margin: 0.75rem 0 0;
  text-align: center;
}

.checkin-stats {
  display: flex;
  gap: 1rem;
  margin: 0 0 1rem;
}

.checkin-stat {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  background: var(--bg-muted, rgba(139, 51, 82, 0.06));
  text-align: center;
  transition: background 0.35s ease;
}

.checkin-stats.celebrating .checkin-stat.bump {
  background: color-mix(in srgb, var(--success) 14%, transparent);
}

.checkin-stat strong {
  display: block;
  font-size: 1.375rem;
  line-height: 1.2;
  color: var(--accent-primary, #8b3352);
  font-variant-numeric: tabular-nums;
  transition: transform 0.35s cubic-bezier(0.34, 1.35, 0.64, 1), color 0.35s ease;
}

.checkin-stat.bump strong {
  animation: checkin-stat-bump 0.65s cubic-bezier(0.34, 1.35, 0.64, 1);
  color: var(--success);
}

.checkin-stat span {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.checkin-btn {
  align-self: flex-start;
  position: relative;
  overflow: hidden;
  min-width: 7.5rem;
}

.checkin-btn.success,
.checkin-btn.success:disabled {
  background: color-mix(in srgb, var(--success, #7d9f7a) 18%, var(--bg-card, #fff));
  color: var(--success, #5f7f5c);
  border: 1.5px solid var(--success, #7d9f7a);
  opacity: 1;
  cursor: default;
  box-shadow: none;
  transform: none;
}

.checkin-btn.success .checkin-btn-label,
.checkin-btn.success:disabled .checkin-btn-label {
  color: inherit;
  opacity: 1;
}

.checkin-btn.celebrating {
  animation: checkin-btn-pop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.checkin-btn-label {
  display: inline-block;
  position: relative;
  z-index: 1;
}

.checkin-message {
  margin-top: 0.75rem;
  animation: checkin-msg-in 0.4s ease both;
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
  transition:
    background 0.35s ease,
    color 0.35s ease,
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

.day-cell.empty {
  background: transparent;
}

/* 过去且未打卡：灰色偏暗 */
.day-cell.missed {
  background: color-mix(in srgb, var(--text-muted, #9a9590) 12%, transparent);
  color: color-mix(in srgb, var(--text-muted, #9a9590) 75%, transparent);
  font-weight: 450;
  opacity: 0.72;
}

/* 已打卡（含过去已打）：绿色 */
.day-cell.checked {
  background: color-mix(in srgb, var(--success) 22%, transparent);
  color: var(--success);
  font-weight: 700;
  opacity: 1;
}

/* 今天未打卡：只保留描边，不填充变色 */
.day-cell.today:not(.checked) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 500;
  opacity: 1;
  box-shadow: inset 0 0 0 2px var(--gold, var(--accent-primary));
}

/* 今天已打卡：保留描边 + 明显变绿 */
.day-cell.today.checked {
  background: var(--success, #7d9f7a);
  color: #fff;
  font-weight: 700;
  box-shadow: inset 0 0 0 2px var(--gold, var(--accent-primary));
}

.day-cell.celebrate {
  animation: checkin-day-celebrate 0.85s cubic-bezier(0.34, 1.35, 0.64, 1);
  z-index: 1;
}

/* 未到的日子：保持原样 */
.day-cell.future:not(.checked) {
  color: var(--text-muted);
  background: var(--bg-secondary);
  opacity: 1;
}

.day-num {
  display: block;
  line-height: 1;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
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

.dot.missed {
  background: color-mix(in srgb, var(--text-muted, #9a9590) 35%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-muted, #9a9590) 55%, transparent);
}

.dot.checked {
  background: rgba(125, 159, 122, 0.2);
  box-shadow: inset 0 0 0 2px var(--success);
}

.dot.today {
  background: var(--bg-card);
  box-shadow: inset 0 0 0 2px var(--gold, var(--accent-primary));
}

.dot.future {
  background: var(--bg-secondary);
  box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(0, 0, 0, 0.12));
}

.center {
  text-align: center;
  padding: 1rem 0;
}

.success {
  color: var(--success, #7d9f7a);
}

@keyframes checkin-btn-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes checkin-day-celebrate {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.18);
  }
  55% {
    transform: scale(0.96);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes checkin-stat-bump {
  0% {
    transform: scale(1) translateY(0);
  }
  40% {
    transform: scale(1.18) translateY(-2px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@keyframes checkin-msg-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .checkin-btn.celebrating,
  .day-cell.celebrate,
  .checkin-stat.bump strong,
  .checkin-message {
    animation: none;
  }

  .day-cell,
  .checkin-stat,
  .checkin-stat strong {
    transition: none;
  }
}
</style>
