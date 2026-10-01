import { onBeforeUnmount, onMounted } from 'vue'

/** 页面可见时按间隔轮询；切到后台暂停，回来后立刻拉一次再恢复间隔 */
export function usePagePoll(tick: () => void | Promise<void>, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight = false

  async function run() {
    if (typeof document !== 'undefined' && document.hidden) return
    if (inFlight) return
    inFlight = true
    try {
      await tick()
    } finally {
      inFlight = false
    }
  }

  function start() {
    stop()
    timer = setInterval(() => {
      void run()
    }, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function onVisibility() {
    if (document.hidden) {
      stop()
      return
    }
    void run()
    start()
  }

  onMounted(() => {
    start()
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
