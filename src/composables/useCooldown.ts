import { onBeforeUnmount, reactive, ref } from 'vue'

export function parseRetryAfterMs(message: string, fallbackMs: number) {
  const match = message.match(/(\d+)\s*秒/)
  if (!match) return fallbackMs
  return Number(match[1]) * 1000
}

export function isRateLimitMessage(message: string) {
  return message.includes('过于频繁') || message.includes('秒后再试')
}

export function useCooldown() {
  const left = ref(0)
  let endsAt = 0
  let timer: ReturnType<typeof setInterval> | null = null

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function tick() {
    left.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
    if (left.value <= 0) stop()
  }

  function start(ms: number) {
    endsAt = Date.now() + Math.max(0, ms)
    tick()
    stop()
    if (left.value > 0) {
      timer = setInterval(tick, 200)
    }
  }

  function startFromError(err: unknown, fallbackMs: number) {
    const message = err instanceof Error ? err.message : String(err)
    if (!isRateLimitMessage(message)) return false
    start(parseRetryAfterMs(message, fallbackMs))
    return true
  }

  onBeforeUnmount(stop)

  return reactive({
    left,
    start,
    startFromError,
    stop,
  })
}
