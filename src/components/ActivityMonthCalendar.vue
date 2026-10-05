<script setup lang="ts">
import { computed } from 'vue'
import type { ActivityItem } from '@/types/api'
import { getActivityStatus } from '@/utils/activity'
import { buildMonthGrid, eachDateKeyInclusive, getTodayKey } from '@/utils/calendar'

const props = defineProps<{
  activities: ActivityItem[]
  year: number
  month: number
  selectedDate?: string | null
}>()

const emit = defineEmits<{
  'change-month': [delta: number]
  select: [date: string]
  'jump-today': []
}>()

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const todayKey = getTodayKey()

const monthLabel = computed(() => `${props.year} 年 ${props.month} 月`)
const cells = computed(() => buildMonthGrid(props.year, props.month))

const byDate = computed(() => {
  const map = new Map<string, ActivityItem[]>()
  for (const act of props.activities) {
    for (const key of eachDateKeyInclusive(act.startTime, act.endTime)) {
      const list = map.get(key) ?? []
      list.push(act)
      map.set(key, list)
    }
  }
  return map
})

function tonesFor(date: string) {
  const items = byDate.value.get(date) ?? []
  const tones = new Set(items.map((act) => getActivityStatus(act.startTime, act.endTime).tone))
  return {
    count: items.length,
    ongoing: tones.has('ongoing'),
    upcoming: tones.has('upcoming'),
    ended: tones.has('ended'),
  }
}

function onDayClick(date: string | null) {
  if (!date) return
  emit('select', date)
}

function goMonth(delta: number) {
  emit('change-month', delta)
}

function jumpToday() {
  emit('jump-today')
}
</script>

<template>
  <div class="act-cal">
    <div class="act-cal-head">
      <button type="button" class="btn btn-ghost month-btn" aria-label="上一月" @click="goMonth(-1)">‹</button>
      <div class="act-cal-title">
        <strong>{{ monthLabel }}</strong>
        <button type="button" class="today-jump" @click="jumpToday">回到今天</button>
      </div>
      <button type="button" class="btn btn-ghost month-btn" aria-label="下一月" @click="goMonth(1)">›</button>
    </div>

    <div class="weekdays">
      <span v-for="day in weekdays" :key="day">{{ day }}</span>
    </div>
    <div class="days">
      <button
        v-for="(cell, index) in cells"
        :key="`${cell.date ?? 'empty'}-${index}`"
        type="button"
        class="day-cell"
        :class="{
          empty: !cell.date,
          today: cell.date === todayKey,
          selected: cell.date && cell.date === selectedDate,
          has: cell.date && (byDate.get(cell.date)?.length ?? 0) > 0,
          ongoing: cell.date && tonesFor(cell.date).ongoing,
          upcoming: cell.date && tonesFor(cell.date).upcoming && !tonesFor(cell.date).ongoing,
          ended: cell.date && tonesFor(cell.date).ended && !tonesFor(cell.date).ongoing && !tonesFor(cell.date).upcoming,
        }"
        :disabled="!cell.date"
        :aria-label="cell.date ? `${cell.date}，${tonesFor(cell.date).count} 项活动` : undefined"
        @click="onDayClick(cell.date)"
      >
        <span v-if="cell.day" class="day-num">{{ cell.day }}</span>
        <span v-if="cell.date && tonesFor(cell.date).count" class="day-count">{{ tonesFor(cell.date).count }}</span>
      </button>
    </div>

    <div class="legend">
      <span><i class="dot ongoing" />进行中</span>
      <span><i class="dot upcoming" />即将开始</span>
      <span><i class="dot ended" />已结束</span>
    </div>
  </div>
</template>

<style scoped>
.act-cal {
  padding: 1rem 1.1rem 1.15rem;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.act-cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.act-cal-title {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.act-cal-title strong {
  font-size: 1rem;
  color: var(--text-primary);
}

.today-jump {
  border: none;
  background: none;
  color: var(--accent-primary);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
}

.month-btn {
  min-width: 36px;
  padding: 0.375rem 0.625rem;
  font-size: 1.25rem;
  line-height: 1;
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
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font: inherit;
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  cursor: pointer;
}

.day-cell.empty,
.day-cell:disabled.empty {
  background: transparent;
  cursor: default;
}

.day-cell.has.ongoing {
  background: color-mix(in srgb, var(--warning, #c4a35a) 22%, var(--bg-card));
  color: var(--text-primary);
  font-weight: 650;
}

.day-cell.has.upcoming {
  background: color-mix(in srgb, var(--success) 18%, var(--bg-card));
  color: var(--text-primary);
  font-weight: 600;
}

.day-cell.has.ended {
  background: color-mix(in srgb, var(--text-muted) 14%, var(--bg-card));
  color: var(--text-secondary);
}

.day-cell.today {
  box-shadow: inset 0 0 0 2px var(--gold, var(--accent-primary));
}

.day-cell.selected {
  border-color: var(--accent-primary);
}

.day-count {
  position: absolute;
  right: 4px;
  bottom: 3px;
  font-size: 0.625rem;
  color: var(--accent-primary);
  font-weight: 700;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-top: 0.9rem;
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

.dot.ongoing {
  background: color-mix(in srgb, var(--warning, #c4a35a) 55%, transparent);
}

.dot.upcoming {
  background: color-mix(in srgb, var(--success) 55%, transparent);
}

.dot.ended {
  background: color-mix(in srgb, var(--text-muted) 45%, transparent);
}
</style>
