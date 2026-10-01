<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getDashboardStats, type AdminDashboardStats } from '@/api/admin/stats'

const auth = useAuthStore()
const stats = ref<AdminDashboardStats | null>(null)
const loading = ref(false)
const error = ref('')

const modules = [
  { to: '/admin/streamer', icon: '🏠', title: '博主资料', desc: '名称、头像、标签、简介' },
  { to: '/admin/banners', icon: '🖼', title: 'Banner', desc: '首页轮播图管理' },
  { to: '/admin/songs', icon: '🎵', title: '音乐', desc: '歌曲、封面与音频' },
  { to: '/admin/activities', icon: '📅', title: '活动', desc: '活动日历与封面' },
  { to: '/admin/gallery', icon: '🎨', title: '图集', desc: '二次元 / 三次元' },
  { to: '/admin/awards', icon: '🏆', title: '荣誉', desc: '获奖记录管理' },
  { to: '/admin/graph', icon: '🕸', title: '关系图谱', desc: '人物与关系连线' },
  { to: '/admin/messages', icon: '💬', title: '留言与举报', desc: '审核留言、处理举报' },
  { to: '/admin/users', icon: '👥', title: '用户', desc: '封禁、协管员设置' },
  { to: '/admin/sensitive-words', icon: '🛡', title: '敏感词', desc: '留言拦截词库' },
  { to: '/admin/avatars', icon: '👤', title: '预设头像', desc: '注册可选头像池' },
  { to: '/admin/logs', icon: '📋', title: '操作日志', desc: '后台操作审计' },
]

const kpis = computed(() => {
  const data = stats.value
  const dash = (n: number | null | undefined) => (loading.value && data == null ? '—' : String(n ?? 0))
  const items = [
    {
      to: '/admin/messages?tab=reports',
      icon: '⚑',
      value: dash(data?.pendingReports),
      label: '待处理举报',
      alert: (data?.pendingReports ?? 0) > 0,
    },
    {
      to: '/admin/messages',
      icon: '💬',
      value: dash(data?.publicMessagesToday),
      label: '今日公开留言',
    },
    {
      to: '/admin/users',
      icon: '📅',
      value: dash(data?.checkinsToday),
      label: '今日打卡',
    },
    {
      to: '/admin/users',
      icon: '👥',
      value: dash(data?.users),
      label: data ? `用户（访客 ${data.fans}）` : '用户',
    },
    {
      to: '/admin/users',
      icon: '🚫',
      value: dash(data?.bannedUsers),
      label: '已封禁',
      alert: (data?.bannedUsers ?? 0) > 0,
    },
    {
      to: '/admin/activities',
      icon: '🎪',
      value: dash(data?.ongoingActivities),
      label: data ? `进行中活动 / 共 ${data.activities}` : '进行中活动',
    },
  ]

  if (auth.hasRole(['streamer'])) {
    items.splice(2, 0, {
      to: '/admin/messages?tab=private',
      icon: '🔒',
      value: dash(data?.privateMessages),
      label: '私密留言',
    })
  }

  return items
})

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    stats.value = await getDashboardStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '统计加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="admin-top">
      <div>
        <h1 class="admin-page-title">管理概览</h1>
        <p class="muted">欢迎，{{ auth.user?.nickname }}。数字按上海时区统计「今天」。点击可进入对应模块。</p>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="admin-kpi-row">
      <RouterLink
        v-for="item in kpis"
        :key="item.label"
        :to="item.to"
        class="admin-kpi-card"
        :class="{ alert: item.alert }"
      >
        <div class="admin-kpi-icon">{{ item.icon }}</div>
        <div>
          <div class="admin-kpi-value">{{ item.value }}</div>
          <div class="admin-kpi-label">{{ item.label }}</div>
        </div>
      </RouterLink>
    </div>

    <h2 class="admin-section-title">功能入口</h2>
    <div class="admin-stats-row">
      <RouterLink v-for="item in modules" :key="item.to" :to="item.to" class="admin-stat-card">
        <div class="admin-stat-icon">{{ item.icon }}</div>
        <div class="admin-stat-info">
          <div class="admin-stat-value">{{ item.title }}</div>
          <div class="admin-stat-label">{{ item.desc }}</div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.admin-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.admin-kpi-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.admin-kpi-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-1px);
}

.admin-kpi-card.alert {
  border-color: var(--danger);
}

.admin-kpi-icon {
  font-size: 1.25rem;
}

.admin-kpi-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.1;
}

.admin-kpi-label {
  margin-top: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.admin-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-secondary);
}
</style>
