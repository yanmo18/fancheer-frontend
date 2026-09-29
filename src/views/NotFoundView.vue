<template>
  <div class="not-found-page">
    <p class="code">404</p>
    <h1>页面不存在</h1>
    <p class="muted">链接可能已失效，或地址输入有误。</p>
    <div class="actions">
      <RouterLink to="/" class="btn btn-primary">返回首页</RouterLink>
      <RouterLink to="/activities" class="btn btn-ghost">看活动日历</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
</style>
