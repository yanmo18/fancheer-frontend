<script setup lang="ts">

import { computed, onMounted, ref } from 'vue'

import { RouterLink } from 'vue-router'

import ActivityListItem from '@/components/ActivityListItem.vue'

import * as publicApi from '@/api/public'

import { withDemoActivities } from '@/utils/demoContent'

import { getActivityStatus } from '@/utils/activity'

import type { ActivityItem } from '@/types/api'



const loading = ref(true)

const error = ref('')

const activities = ref<ActivityItem[]>([])



const activityStats = computed(() => {

  let ongoing = 0

  let upcoming = 0

  let ended = 0

  for (const act of activities.value) {

    const tone = getActivityStatus(act.startTime, act.endTime).tone

    if (tone === 'ongoing') ongoing += 1

    else if (tone === 'upcoming') upcoming += 1

    else ended += 1

  }

  return { total: activities.value.length, ongoing, upcoming, ended }

})



const groupedActivities = computed(() => {

  const groups = new Map<string, ActivityItem[]>()



  for (const act of activities.value) {

    const date = new Date(act.startTime)

    const key = Number.isNaN(date.getTime())

      ? '时间待定'

      : `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`



    const list = groups.get(key) ?? []

    list.push(act)

    groups.set(key, list)

  }



  return [...groups.entries()].map(([label, items]) => ({ label, items }))

})



onMounted(async () => {

  try {

    const list = await publicApi.getActivities()

    activities.value = withDemoActivities(list)

  } catch (e) {

    error.value = e instanceof Error ? e.message : '加载失败'

  } finally {

    loading.value = false

  }

})

</script>



<template>

  <div class="activities-page">

    <div class="activities-hero">

      <RouterLink to="/" class="back-link">← 返回首页</RouterLink>



      <div class="hero-head">

        <div>

          <div class="section-label">行程记录</div>

          <h1 class="page-title">活动日历</h1>

          <div class="section-line" />

          <p class="page-desc">全部活动与行程安排，按月份浏览。</p>

        </div>



        <div v-if="activities.length" class="activity-stats" aria-label="活动统计">

          <div class="stat-chip">

            <span class="stat-value">{{ activityStats.total }}</span>

            <span class="stat-label">全部</span>

          </div>

          <div class="stat-chip stat-chip--ongoing">

            <span class="stat-value">{{ activityStats.ongoing }}</span>

            <span class="stat-label">进行中</span>

          </div>

          <div class="stat-chip stat-chip--upcoming">

            <span class="stat-value">{{ activityStats.upcoming }}</span>

            <span class="stat-label">即将开始</span>

          </div>

          <div class="stat-chip stat-chip--ended">

            <span class="stat-value">{{ activityStats.ended }}</span>

            <span class="stat-label">已结束</span>

          </div>

        </div>

      </div>

    </div>



    <p v-if="loading" class="state">加载中...</p>

    <p v-else-if="error" class="state error">{{ error }}</p>

    <p v-else-if="!activities.length" class="state">暂无活动</p>



    <div v-else class="activities-content">

      <section

        v-for="group in groupedActivities"

        :key="group.label"

        class="activity-month-group"

      >

        <h2 class="month-title">{{ group.label }}</h2>

        <div class="activity-list">

          <ActivityListItem

            v-for="act in group.items"

            :key="act.id"

            :activity="act"

            variant="page"

          />

        </div>

      </section>

    </div>

  </div>

</template>



<style scoped>

.activities-page {

  max-width: 920px;

  margin: 0 auto;

  padding: 5.5rem 1.5rem 3.5rem;

}



.activities-hero {

  margin-bottom: 2rem;

  padding: 1.5rem 1.75rem;

  border-radius: 20px;

  border: 1px solid var(--border-subtle);

  background:

    radial-gradient(circle at top right, rgba(201, 169, 98, 0.12), transparent 45%),

    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(252, 248, 242, 0.9));

  box-shadow: 0 14px 36px rgba(62, 48, 35, 0.06);

}



.back-link {

  display: inline-block;

  margin-bottom: 1rem;

  font-size: 0.875rem;

  color: var(--text-muted);

  text-decoration: none;

  transition: color 0.2s ease;

}



.back-link:hover {

  color: var(--accent-primary);

}



.hero-head {

  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 1.5rem;

}



.page-title {

  margin: 0;

  font-family: 'Cormorant Garamond', serif;

  font-size: clamp(1.75rem, 4vw, 2.25rem);

  font-weight: 600;

  color: var(--text-primary);

}



.page-desc {

  margin: 0.75rem 0 0;

  max-width: 36rem;

  font-size: 0.875rem;

  color: var(--text-secondary);

  line-height: 1.7;

}



.activity-stats {

  display: flex;

  flex-wrap: wrap;

  gap: 0.625rem;

  justify-content: flex-end;

}



.stat-chip {

  min-width: 4.25rem;

  padding: 0.5rem 0.875rem;

  border-radius: 12px;

  text-align: center;

  background: var(--bg-card);

  border: 1px solid var(--border-subtle);

}



.stat-chip--ongoing {

  border-color: rgba(196, 163, 90, 0.35);

  background: rgba(196, 163, 90, 0.1);

}



.stat-chip--upcoming {

  border-color: rgba(125, 159, 122, 0.35);

  background: rgba(125, 159, 122, 0.1);

}



.stat-chip--ended {

  border-color: rgba(120, 113, 108, 0.2);

  background: rgba(120, 113, 108, 0.06);

}



.stat-value {

  display: block;

  font-family: 'Cormorant Garamond', serif;

  font-size: 1.375rem;

  font-weight: 600;

  color: var(--accent-primary);

  line-height: 1.1;

}



.stat-label {

  display: block;

  margin-top: 0.125rem;

  font-size: 0.6875rem;

  color: var(--text-muted);

  letter-spacing: 0.04em;

}



.activities-content {

  display: flex;

  flex-direction: column;

  gap: 2rem;

}



.activity-month-group {

  display: flex;

  flex-direction: column;

  gap: 0.875rem;

}



.month-title {

  margin: 0;

  padding-bottom: 0.5rem;

  border-bottom: 1px solid var(--border-subtle);

  font-family: 'Cormorant Garamond', serif;

  font-size: 1.25rem;

  font-weight: 600;

  color: var(--text-primary);

}



.activity-list {

  display: flex;

  flex-direction: column;

  gap: 0.875rem;

}



.state {

  padding: 3rem 0;

  text-align: center;

  color: var(--text-muted);

}



.state.error {

  color: var(--danger);

}



@media (max-width: 768px) {

  .hero-head {

    flex-direction: column;

    align-items: flex-start;

  }



  .activity-stats {

    justify-content: flex-start;

  }

}

</style>

