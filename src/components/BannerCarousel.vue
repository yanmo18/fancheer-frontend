<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BannerItem } from '@/types/api'

const props = defineProps<{
  banners: BannerItem[]
  interval?: number
}>()

const current = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const hasMultiple = computed(() => props.banners.length > 1)

function goTo(index: number) {
  if (!props.banners.length) return
  current.value = (index + props.banners.length) % props.banners.length
}

function next() {
  goTo(current.value + 1)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  stopTimer()
  if (!hasMultiple.value || paused.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(next, props.interval ?? 5000)
}

function onEnter() {
  paused.value = true
  stopTimer()
}

function onLeave() {
  paused.value = false
  startTimer()
}

watch(
  () => props.banners.length,
  () => {
    current.value = 0
    startTimer()
  },
)

onMounted(startTimer)
onBeforeUnmount(stopTimer)

function bannerHref(linkUrl?: string) {
  if (!linkUrl || linkUrl === '#') return undefined
  return linkUrl
}

const trackStyle = computed(() => ({
  transform: `translateX(-${current.value * 100}%)`,
}))
</script>

<template>
  <section
    v-if="banners.length"
    class="banner-section"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="banner-track" :style="trackStyle">
      <div v-for="item in banners" :key="item.id" class="banner-slide">
        <a
          v-if="bannerHref(item.linkUrl)"
          class="banner-slide-link"
          :href="bannerHref(item.linkUrl)"
          :target="bannerHref(item.linkUrl)?.startsWith('http') ? '_blank' : undefined"
          :rel="bannerHref(item.linkUrl)?.startsWith('http') ? 'noopener noreferrer' : undefined"
        >
          <img :src="item.imageUrl" :alt="item.title || ''" />
          <div v-if="item.title" class="banner-caption">{{ item.title }}</div>
        </a>
        <template v-else>
          <img :src="item.imageUrl" :alt="item.title || ''" />
          <div v-if="item.title" class="banner-caption">{{ item.title }}</div>
        </template>
      </div>
    </div>

    <div v-if="hasMultiple" class="banner-dots">
      <button
        v-for="(item, index) in banners"
        :key="item.id"
        type="button"
        class="banner-dot"
        :class="{ active: index === current }"
        :aria-label="`第 ${index + 1} 张`"
        @click="goTo(index)"
      />
    </div>
  </section>
</template>

<style scoped>
.banner-slide {
  position: relative;
}

.banner-slide-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.banner-caption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2.5rem 1.5rem 1rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  color: #fff;
  font-weight: 500;
  font-size: 0.9375rem;
}
</style>
