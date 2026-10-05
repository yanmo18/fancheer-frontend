<script setup lang="ts">
import AppModal from '@/components/AppModal.vue'
import { confirmState, resolveConfirm } from '@/composables/useConfirm'
</script>

<template>
  <AppModal :open="confirmState.open" title-id="app-confirm-title" @close="resolveConfirm(false)">
    <h2 id="app-confirm-title" class="confirm-title">{{ confirmState.title }}</h2>
    <p class="confirm-message">{{ confirmState.message }}</p>
    <div class="confirm-actions">
      <button type="button" class="btn btn-ghost" @click="resolveConfirm(false)">取消</button>
      <button type="button" class="btn btn-primary danger" @click="resolveConfirm(true)">
        {{ confirmState.confirmLabel }}
      </button>
    </div>
  </AppModal>
</template>

<style scoped>
.confirm-title {
  margin: 0 0 0.75rem;
  font-family: 'Noto Serif SC', serif;
  font-size: 1.15rem;
}

.confirm-message {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
</style>
