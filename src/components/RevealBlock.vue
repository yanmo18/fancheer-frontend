<script setup lang="ts">
import { ref } from 'vue'
import { useReveal } from '@/composables/useReveal'

defineProps<{
  variant: 'banner' | 'about' | 'music' | 'gallery' | 'events' | 'graph'
  tag?: 'section' | 'div'
}>()

const root = ref<HTMLElement | null>(null)
useReveal(root)
</script>

<template>
  <component :is="tag ?? 'div'" ref="root" :class="['reveal', `reveal--${variant}`]">
    <slot />
  </component>
</template>
