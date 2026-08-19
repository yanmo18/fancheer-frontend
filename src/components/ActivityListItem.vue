<script setup lang="ts">
import type { ActivityItem } from '@/types/api'
import { formatActivityRange, getActivityStatus } from '@/utils/activity'

defineProps<{
  activity: ActivityItem
}>()

function activityDateParts(iso: string) {
  const d = new Date(iso)
  return { month: `${d.getMonth() + 1}月`, day: String(d.getDate()) }
}

function badgeClass(tone: string) {
  if (tone === 'ongoing') return 'ongoing'
  if (tone === 'upcoming') return 'upcoming'
  return 'ended'
}
</script>

<template>
  <article class="activity-item">
    <div v-if="activity.coverUrl" class="activity-cover">
      <img :src="activity.coverUrl" :alt="activity.title" />
    </div>
    <div class="activity-date">
      <div class="activity-date-month">{{ activityDateParts(activity.startTime).month }}</div>
      <div class="activity-date-day">{{ activityDateParts(activity.startTime).day }}</div>
    </div>
    <div class="activity-body">
      <div class="activity-title">{{ activity.title }}</div>
      <div class="activity-desc">
        {{ activity.description || formatActivityRange(activity.startTime, activity.endTime) }}
      </div>
    </div>
    <div
      class="activity-badge"
      :class="badgeClass(getActivityStatus(activity.startTime, activity.endTime).tone)"
    >
      {{ getActivityStatus(activity.startTime, activity.endTime).label }}
    </div>
  </article>
</template>

<style scoped>
.activity-cover {
  flex-shrink: 0;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-elevated);
}

.activity-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .activity-cover {
    display: none;
  }
}
</style>
