<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { BannerItem } from '@/types/api'
import { resolveMediaUrl } from '@/utils/mediaUrl'

const props = defineProps<{
  banners: BannerItem[]
  interval?: number
}>()

const router = useRouter()
const current = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const hasMultiple = computed(() => props.banners.length > 1)

const KNOWN_PUBLIC_PATHS = new Set([
  '/messages',
  '/profile',
  '/checkin',
  '/activities',
  '/terms',
  '/login',
  '/register',
])

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

function isHomeOnlyPath(pathname: string, hash: string) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path !== '/') return false
  return !hash || hash === '#'
}

function isMusicTarget(pathname: string, hash: string, title: string) {
  const path = pathname.toLowerCase()
  const h = hash.toLowerCase()
  if (
    path === '/songs' ||
    path === '/song' ||
    path === '/music' ||
    path.startsWith('/songs/') ||
    path.startsWith('/music/') ||
    path === '/admin/songs'
  ) {
    return true
  }
  if (
    h === '#home-music' ||
    h === '#music' ||
    h === '#songs' ||
    h.includes('music') ||
    h.includes('song')
  ) {
    return true
  }
  if (isHomeOnlyPath(pathname, hash) && /单曲|音乐|歌曲|新歌/.test(title)) {
    return true
  }
  return false
}

function isActivityTarget(pathname: string, hash: string, title = '') {
  const path = pathname.toLowerCase()
  const h = hash.toLowerCase()
  if (path === '/activities' || path === '/activity' || path.startsWith('/activities/')) {
    return true
  }
  if (h.includes('activit') || h.includes('event') || h.includes('活动')) return true
  if (isHomeOnlyPath(pathname, hash) && /活动|日历|日程|event/i.test(title)) {
    return true
  }
  return false
}

function scrollToHomeMusic() {
  const el = document.getElementById('home-music')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  void router.push({ path: '/', hash: '#home-music' }).then(() => {
    requestAnimationFrame(() => {
      document.getElementById('home-music')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

/** 有跳转目标则处理；欢迎/无链接等 → noop（点击无变化） */
function resolveBannerClick(item: BannerItem): 'handled' | 'noop' {
  const raw = (item.linkUrl || '').trim()
  const title = item.title || ''

  if (!raw || raw === '#') {
    if (/活动|日历|日程|event/i.test(title)) {
      void router.push('/activities')
      return 'handled'
    }
    if (/单曲|音乐|歌曲|新歌/.test(title)) {
      scrollToHomeMusic()
      return 'handled'
    }
    return 'noop'
  }

  if (/^https?:\/\//i.test(raw)) {
    window.open(raw, '_blank', 'noopener,noreferrer')
    return 'handled'
  }

  let pathname = raw
  let hash = ''
  try {
    const url = new URL(raw, window.location.origin)
    pathname = url.pathname || '/'
    hash = url.hash || ''
  } catch {
    return 'noop'
  }

  if (isMusicTarget(pathname, hash, title)) {
    scrollToHomeMusic()
    return 'handled'
  }

  if (isActivityTarget(pathname, hash, title)) {
    void router.push('/activities')
    return 'handled'
  }

  if (isHomeOnlyPath(pathname, hash)) {
    return 'noop'
  }

  const normalized = pathname.replace(/\/+$/, '') || '/'
  if (KNOWN_PUBLIC_PATHS.has(normalized) || normalized.startsWith('/admin')) {
    void router.push(pathname + hash)
    return 'handled'
  }

  return 'noop'
}

function onBannerClick(item: BannerItem, event: Event) {
  event.preventDefault()
  event.stopPropagation()
  resolveBannerClick(item)
}

function bannerInteractiveLabel(item: BannerItem) {
  const raw = (item.linkUrl || '').trim()
  if (!raw || raw === '#' || raw === '/') return item.title || 'Banner'
  return `打开：${item.title || 'Banner'}`
}

function isBannerClickable(item: BannerItem) {
  return resolveBannerClickIntent(item) !== 'noop'
}

/** 仅用于 cursor/aria，不触发导航副作用 */
function resolveBannerClickIntent(item: BannerItem): 'handled' | 'noop' {
  const raw = (item.linkUrl || '').trim()
  const title = item.title || ''
  if (!raw || raw === '#') {
    if (/活动|日历|日程|event/i.test(title)) return 'handled'
    if (/单曲|音乐|歌曲|新歌/.test(title)) return 'handled'
    return 'noop'
  }
  if (/^https?:\/\//i.test(raw)) return 'handled'
  try {
    const url = new URL(raw, 'http://local.invalid')
    const pathname = url.pathname || '/'
    const hash = url.hash || ''
    if (isMusicTarget(pathname, hash, title)) return 'handled'
    if (isActivityTarget(pathname, hash, title)) return 'handled'
    if (isHomeOnlyPath(pathname, hash)) return 'noop'
    const normalized = pathname.replace(/\/+$/, '') || '/'
    if (KNOWN_PUBLIC_PATHS.has(normalized) || normalized.startsWith('/admin')) return 'handled'
  } catch {
    return 'noop'
  }
  return 'noop'
}

const trackStyle = computed(() => ({
  transform: `translateX(-${current.value * 100}%)`,
}))

function onBannerImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  const portrait = img.naturalHeight > img.naturalWidth
  img.classList.toggle('is-portrait', portrait)
}
</script>

<template>
  <section
    v-if="banners.length"
    class="banner-section"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="banner-track" :style="trackStyle">
      <div
        v-for="item in banners"
        :key="item.id"
        class="banner-slide"
        :class="{ clickable: isBannerClickable(item) }"
        :role="isBannerClickable(item) ? 'button' : undefined"
        :tabindex="isBannerClickable(item) ? 0 : undefined"
        :aria-label="bannerInteractiveLabel(item)"
        @click="onBannerClick(item, $event)"
        @keydown.enter.prevent="onBannerClick(item, $event)"
        @keydown.space.prevent="onBannerClick(item, $event)"
      >
        <img
          :src="resolveMediaUrl(item.imageUrl)"
          :alt="item.title || ''"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          @load="onBannerImageLoad"
        />
        <div v-if="item.title" class="banner-caption">{{ item.title }}</div>
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
        @click.stop="goTo(index)"
      />
    </div>
  </section>
</template>

<style scoped>
.banner-slide {
  position: relative;
  background: #12080e;
  cursor: default;
}

.banner-slide.clickable {
  cursor: pointer;
}

.banner-slide:focus-visible {
  outline: 2px solid var(--accent-primary, #c9a962);
  outline-offset: -2px;
}

.banner-caption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2.5rem 1.5rem 1rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  color: #fff;
  font-weight: 500;
  font-size: 0.9375rem;
  pointer-events: none;
}
</style>
