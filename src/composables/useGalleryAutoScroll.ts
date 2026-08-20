import { nextTick, onBeforeUnmount, ref, type Ref, watch } from 'vue'

const SCROLL_SPEED = 0.45
const RESUME_DELAY_MS = 2400
const RETRY_MS = 400
const MAX_RETRIES = 12

export function useGalleryAutoScroll(
  scrollRef: Ref<HTMLElement | null>,
  options: {
    itemCount: Ref<number>
    paused?: Ref<boolean>
  },
) {
  const hovering = ref(false)
  const userLocked = ref(false)

  let direction = 1
  let rafId = 0
  let resumeTimer: ReturnType<typeof setTimeout> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let resizeObserver: ResizeObserver | null = null
  let intersectionObserver: IntersectionObserver | null = null
  let reduceMotion = false
  let visible = true
  let retryCount = 0

  function clearResumeTimer() {
    if (resumeTimer) {
      clearTimeout(resumeTimer)
      resumeTimer = null
    }
  }

  function clearRetryTimer() {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  function scheduleResume() {
    clearResumeTimer()
    resumeTimer = setTimeout(() => {
      userLocked.value = false
    }, RESUME_DELAY_MS)
  }

  function pauseFromUser() {
    userLocked.value = true
    scheduleResume()
  }

  function onHoverEnter() {
    hovering.value = true
  }

  function onHoverLeave() {
    hovering.value = false
  }

  function isScrollable(el: HTMLElement) {
    return el.scrollWidth - el.clientWidth > 4
  }

  function scheduleRetry() {
    if (retryCount >= MAX_RETRIES) return
    clearRetryTimer()
    retryTimer = setTimeout(() => {
      retryCount += 1
      start()
    }, RETRY_MS)
  }

  function tick() {
    const el = scrollRef.value
    const externalPaused = options.paused?.value ?? false
    const canScroll =
      el &&
      visible &&
      !reduceMotion &&
      !externalPaused &&
      !hovering.value &&
      !userLocked.value &&
      options.itemCount.value > 1

    if (canScroll) {
      if (isScrollable(el)) {
        retryCount = 0
        const maxScroll = el.scrollWidth - el.clientWidth
        if (el.scrollLeft >= maxScroll - 0.5) direction = -1
        else if (el.scrollLeft <= 0.5) direction = 1
        el.scrollLeft += direction * SCROLL_SPEED
      } else if (retryCount < MAX_RETRIES) {
        scheduleRetry()
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  function observeResize() {
    resizeObserver?.disconnect()
    resizeObserver = null

    const el = scrollRef.value
    if (!el) return

    resizeObserver = new ResizeObserver(() => {
      retryCount = 0
    })
    resizeObserver.observe(el)

    for (const img of el.querySelectorAll('img')) {
      if (!img.complete) {
        img.addEventListener('load', () => {
          retryCount = 0
        }, { once: true })
      }
    }
  }

  function observeVisibility() {
    intersectionObserver?.disconnect()
    intersectionObserver = null

    const el = scrollRef.value
    if (!el) return

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
      },
      { threshold: 0.05, rootMargin: '40px 0px' },
    )
    intersectionObserver.observe(el)
  }

  function start() {
    stop()
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const el = scrollRef.value
    if (!el) return

    observeResize()
    observeVisibility()
    rafId = requestAnimationFrame(tick)

    if (!isScrollable(el)) {
      scheduleRetry()
    }
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    clearResumeTimer()
    clearRetryTimer()
    resizeObserver?.disconnect()
    resizeObserver = null
    intersectionObserver?.disconnect()
    intersectionObserver = null
  }

  function resetScroll() {
    const el = scrollRef.value
    if (!el) return
    el.scrollLeft = 0
    direction = 1
    retryCount = 0
  }

  watch(options.itemCount, async () => {
    await nextTick()
    resetScroll()
    start()
  })

  watch(scrollRef, async (el) => {
    if (!el) return
    await nextTick()
    start()
  })

  onBeforeUnmount(stop)

  return {
    onHoverEnter,
    onHoverLeave,
    pauseFromUser,
    start,
    stop,
    resetScroll,
  }
}
