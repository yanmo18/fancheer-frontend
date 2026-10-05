import { reactive } from 'vue'

type ConfirmOptions = {
  title?: string
  confirmLabel?: string
}

export const confirmState = reactive({
  open: false,
  title: '请确认',
  message: '',
  confirmLabel: '确定',
})

let pending: ((ok: boolean) => void) | null = null

export function confirmAction(message: string, options: ConfirmOptions = {}) {
  if (pending) pending(false)
  confirmState.title = options.title ?? '请确认'
  confirmState.message = message
  confirmState.confirmLabel = options.confirmLabel ?? '确定'
  confirmState.open = true
  return new Promise<boolean>((resolve) => {
    pending = resolve
  })
}

export function resolveConfirm(ok: boolean) {
  confirmState.open = false
  const resolve = pending
  pending = null
  resolve?.(ok)
}
