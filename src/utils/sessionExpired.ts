type SessionExpiredHandler = () => void

let handler: SessionExpiredHandler | null = null

export function onSessionExpired(cb: SessionExpiredHandler) {
  handler = cb
}

export function notifySessionExpired() {
  handler?.()
}
