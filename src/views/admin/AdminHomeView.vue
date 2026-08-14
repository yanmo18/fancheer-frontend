<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div>
    <h1>管理概览</h1>
    <p class="muted">欢迎，{{ auth.user?.nickname }}。从下方进入各模块管理。</p>
    <div class="cards">
      <RouterLink to="/admin/streamer" class="card item link-card">
        <strong>博主资料</strong>
        <p class="muted">名称、头像、标签、简介</p>
      </RouterLink>
      <RouterLink to="/admin/banners" class="card item link-card">
        <strong>Banner 管理</strong>
        <p class="muted">首页轮播图增删改查、上传图片</p>
      </RouterLink>
      <RouterLink to="/admin/songs" class="card item link-card">
        <strong>音乐管理</strong>
        <p class="muted">歌曲列表、封面与音频上传</p>
      </RouterLink>
      <RouterLink to="/admin/activities" class="card item link-card">
        <strong>活动管理</strong>
        <p class="muted">活动信息、时间与封面</p>
      </RouterLink>
      <RouterLink to="/admin/gallery" class="card item link-card">
        <strong>图集管理</strong>
        <p class="muted">二次元 / 真人图集</p>
      </RouterLink>
      <RouterLink to="/admin/awards" class="card item link-card">
        <strong>荣誉管理</strong>
        <p class="muted">获奖记录、配图与日期</p>
      </RouterLink>
      <RouterLink to="/admin/users" class="card item link-card">
        <strong>用户管理</strong>
        <p class="muted">用户列表、封禁 / 解封、协管员设置</p>
      </RouterLink>
      <RouterLink to="/admin/messages" class="card item link-card">
        <strong>留言与举报</strong>
        <p class="muted">公开留言审核、举报工单处理</p>
      </RouterLink>
      <RouterLink to="/admin/sensitive-words" class="card item link-card">
        <strong>敏感词管理</strong>
        <p class="muted">新增 / 删除留言拦截词，立即生效</p>
      </RouterLink>
      <RouterLink to="/admin/avatars" class="card item link-card">
        <strong>预设头像</strong>
        <p class="muted">注册时可选的系统头像池</p>
      </RouterLink>
      <RouterLink to="/admin/logs" class="card item link-card">
        <strong>操作日志</strong>
        <p class="muted">查看后台关键操作记录</p>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.item {
  padding: 1rem;
}

.link-card {
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.link-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
}
</style>
