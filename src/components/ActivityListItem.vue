<script setup lang="ts">

import type { ActivityItem } from '@/types/api'

import { formatActivityRange, getActivityStatus } from '@/utils/activity'



withDefaults(

  defineProps<{

    activity: ActivityItem

    variant?: 'default' | 'home' | 'page'

  }>(),

  { variant: 'default' },

)



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

  <article

    class="activity-item"

    :class="{

      'activity-item--home': variant === 'home',

      'activity-item--page': variant === 'page',

    }"

  >

    <div

      v-if="activity.coverUrl"

      class="activity-cover"

      :class="{

        'activity-cover--home': variant === 'home',

        'activity-cover--page': variant === 'page',

      }"

    >

      <img :src="activity.coverUrl" :alt="activity.title" />

    </div>



    <div

      class="activity-date"

      :class="{

        'activity-date--home': variant === 'home',

        'activity-date--page': variant === 'page',

      }"

    >

      <div class="activity-date-month">{{ activityDateParts(activity.startTime).month }}</div>

      <div class="activity-date-day">{{ activityDateParts(activity.startTime).day }}</div>

    </div>



    <div class="activity-body">

      <div class="activity-title">{{ activity.title }}</div>

      <div v-if="activity.description" class="activity-desc">{{ activity.description }}</div>

      <p class="activity-range muted">{{ formatActivityRange(activity.startTime, activity.endTime) }}</p>

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



.activity-cover--home,

.activity-cover--page {

  width: 5.5rem;

  height: 5.5rem;

  border-radius: 12px;

  box-shadow: 0 8px 20px rgba(62, 48, 35, 0.08);

}



.activity-cover img {

  width: 100%;

  height: 100%;

  object-fit: cover;

}



.activity-item--home,

.activity-item--page {

  border-radius: 16px;

  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(252, 247, 240, 0.92));

  box-shadow: 0 8px 24px rgba(62, 48, 35, 0.05);

}



.activity-item--home::before,

.activity-item--page::before {

  content: '';

  position: absolute;

  left: 0;

  top: 0;

  bottom: 0;

  width: 3px;

  background: var(--accent-gradient);

  border-radius: 16px 0 0 16px;

}



.activity-item--home,

.activity-item--page {

  position: relative;

  overflow: hidden;

}



.activity-item--home:hover,

.activity-item--page:hover {

  transform: translateY(-2px);

  border-color: var(--border-accent);

  box-shadow: 0 12px 28px rgba(62, 48, 35, 0.08);

}



.activity-date--home,

.activity-date--page {

  min-width: 72px;

  padding: 12px 14px;

  border-radius: 12px;

  background: rgba(201, 169, 98, 0.1);

  border-color: rgba(201, 169, 98, 0.22);

}



.activity-range {

  margin: 0.375rem 0 0;

  font-size: 0.75rem;

  letter-spacing: 0.02em;

}



.activity-item--page .activity-title {

  font-size: 1rem;

}



.activity-item--page .activity-desc {

  margin-top: 0.25rem;

}



@media (max-width: 640px) {

  .activity-cover--page {

    width: 4.5rem;

    height: 4.5rem;

  }

}

</style>

