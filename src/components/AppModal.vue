<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = withDefaults(
  defineProps<{
    open: boolean
    titleId?: string
    variant?: 'default' | 'lightbox'
  }>(),
  { variant: 'default' },
)

const emit = defineEmits<{ close: [] }>()

const rootRef = ref<HTMLElement | null>(null)
const trapActive = computed(() => props.open)

useFocusTrap(rootRef, trapActive)

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onEscape)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onEscape)
    }
  },
  { flush: 'post' },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <div
    v-if="open"
    ref="rootRef"
    class="modal-mask"
    :class="{ 'modal-mask--lightbox': variant === 'lightbox' }"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @click.self="emit('close')"
  >
    <slot />
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 200;
}

.modal-mask--lightbox {
  background: rgba(0, 0, 0, 0.85);
  cursor: zoom-out;
}
</style>
