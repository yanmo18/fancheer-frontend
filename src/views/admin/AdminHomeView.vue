<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

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
</script>

<template>
  <div>
    <div class="admin-top">
      <div>
        <h1 class="admin-page-title">管理概览</h1>
        <p class="muted">欢迎，{{ auth.user?.nickname }}。从下方进入各模块。</p>
      </div>
    </div>

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
