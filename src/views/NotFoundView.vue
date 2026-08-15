<template>
  <div class="not-found">
    <p class="code">404</p>
    <h1>页面不存在</h1>
    <p class="muted">链接可能已失效，或地址输入有误。</p>
    <div class="actions">
      <RouterLink to="/" class="btn btn-primary">返回首页</RouterLink>
      <RouterLink to="/messages" class="btn btn-ghost">去留言板</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  max-width: 420px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  text-align: center;
}

.code {
  margin: 0;
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  color: #c7d2fe;
}

h1 {
  margin: 0.75rem 0 0.5rem;
  font-size: 1.5rem;
}

.muted {
  margin: 0 0 1.5rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
