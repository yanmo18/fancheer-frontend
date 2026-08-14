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
const activeBanner = computed(() => props.banners[current.value] ?? null)

function goTo(index: number) {
  if (!props.banners.length) return
  current.value = (index + props.banners.length) % props.banners.length
}

function next() {
  goTo(current.value + 1)
}

function prev() {
  goTo(current.value - 1)
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
</script>

<template>
  <section
    v-if="activeBanner"
    class="banner-carousel"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="banner-viewport">
      <Transition name="banner-fade" mode="out-in">
        <a
          v-if="bannerHref(activeBanner.linkUrl)"
          :key="activeBanner.id"
          class="banner-slide"
          :href="bannerHref(activeBanner.linkUrl)"
          :target="bannerHref(activeBanner.linkUrl)?.startsWith('http') ? '_blank' : undefined"
          :rel="bannerHref(activeBanner.linkUrl)?.startsWith('http') ? 'noopener noreferrer' : undefined"
        >
          <img :src="activeBanner.imageUrl" :alt="activeBanner.title" />
          <div v-if="activeBanner.title" class="banner-caption">
            <span>{{ activeBanner.title }}</span>
          </div>
        </a>
        <div v-else :key="`${activeBanner.id}-static`" class="banner-slide">
          <img :src="activeBanner.imageUrl" :alt="activeBanner.title" />
          <div v-if="activeBanner.title" class="banner-caption">
            <span>{{ activeBanner.title }}</span>
          </div>
        </div>
      </Transition>

      <button
        v-if="hasMultiple"
        type="button"
        class="nav prev"
        aria-label="上一张"
        @click="prev"
      >
        ‹
      </button>
      <button
        v-if="hasMultiple"
        type="button"
        class="nav next"
        aria-label="下一张"
        @click="next"
      >
        ›
      </button>
    </div>

    <div v-if="hasMultiple" class="dots" role="tablist" aria-label="Banner 指示器">
      <button
        v-for="(item, index) in banners"
        :key="item.id"
        type="button"
        class="dot"
        :class="{ active: index === current }"
        :aria-label="`第 ${index + 1} 张`"
        :aria-selected="index === current"
        @click="goTo(index)"
      />
    </div>
  </section>
</template>

<style scoped>
.banner-carousel {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.banner-viewport {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.banner-slide {
  display: block;
  position: relative;
  text-decoration: none;
  color: #fff;
}

.banner-slide img {
  width: 100%;
  height: clamp(180px, 32vw, 280px);
  object-fit: cover;
  display: block;
}

.banner-caption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2.5rem 1rem 0.875rem;
  background: linear-gradient(transparent, rgba(15, 23, 42, 0.75));
  font-weight: 600;
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  color: #1e293b;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
  transition: background 0.15s;
}

.nav:hover {
  background: #fff;
}

.nav.prev {
  left: 0.75rem;
}

.nav.next {
  right: 0.75rem;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  padding: 0;
  background: #cbd5e1;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.dot.active {
  background: var(--primary);
  transform: scale(1.2);
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 0.35s ease;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .nav {
    width: 32px;
    height: 32px;
    font-size: 1.25rem;
  }
}
</style>
