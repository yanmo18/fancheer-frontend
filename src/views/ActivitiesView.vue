<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ActivityListItem from '@/components/ActivityListItem.vue'
import * as publicApi from '@/api/public'
import { withDemoActivities } from '@/utils/demoContent'
import type { ActivityItem } from '@/types/api'

const loading = ref(true)
const error = ref('')
const activities = ref<ActivityItem[]>([])

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
    <div class="page-header">
      <RouterLink to="/" class="back-link">← 返回首页</RouterLink>
      <div class="section-header">
        <div>
          <div class="section-label">行程记录</div>
          <div class="section-title">活动日历</div>
          <div class="section-line" />
        </div>
      </div>
      <p class="page-desc">全部活动与行程安排，按时间展示。</p>
    </div>

    <p v-if="loading" class="state">加载中...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>
    <p v-else-if="!activities.length" class="state">暂无活动</p>

    <div v-else class="activity-list">
      <ActivityListItem v-for="act in activities" :key="act.id" :activity="act" />
    </div>
  </div>
</template>

<style scoped>
.activities-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 5.5rem 1.5rem 3rem;
}

.page-header {
  margin-bottom: 1.75rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent-primary);
}

.page-desc {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.state {
  padding: 3rem 0;
  text-align: center;
  color: var(--text-muted);
}

.state.error {
  color: var(--danger);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
