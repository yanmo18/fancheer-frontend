import { onUnmounted, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

function getFocusable(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  )
}

/** 将 Tab 焦点限制在容器内，并在关闭时恢复之前的焦点 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, active: Ref<boolean>) {
  let previousFocus: HTMLElement | null = null

  function onTab(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !containerRef.value) return
    const focusables = getFocusable(containerRef.value)
    if (!focusables.length) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const stop = watch(
    active,
    (on) => {
      if (on) {
        previousFocus = document.activeElement as HTMLElement | null
        requestAnimationFrame(() => {
          const root = containerRef.value
          if (!root) return
          const focusables = getFocusable(root)
          ;(focusables[0] ?? root).focus()
        })
        document.addEventListener('keydown', onTab)
      } else {
        document.removeEventListener('keydown', onTab)
        previousFocus?.focus()
        previousFocus = null
      }
    },
    { flush: 'post' },
  )

  onUnmounted(() => {
    stop()
    document.removeEventListener('keydown', onTab)
  })
}
