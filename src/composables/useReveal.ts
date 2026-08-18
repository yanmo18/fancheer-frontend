import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export function useReveal(root: Ref<HTMLElement | null>, options?: { threshold?: number }) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = root.value
    if (!el) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      },
      {
        threshold: options?.threshold ?? 0.14,
        rootMargin: '0px 0px -32px 0px',
      },
    )

    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })
}
