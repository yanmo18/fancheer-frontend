<template>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <div class="app-loading">
          <p>加载中...</p>
        </div>
      </template>
    </Suspense>
  </RouterView>
</template>

<style scoped>
.app-loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  color: var(--text-muted);
  background: var(--bg-primary);
}
</style>
