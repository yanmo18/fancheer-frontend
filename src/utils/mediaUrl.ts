/** 开发时 Vite 会把 /api、/uploads 代理到后端；这些端口走相对路径即可 */
const VITE_PROXY_PORTS = new Set(['5173', '5174', '4173'])

function backendOrigin(): string {
  const apiBase = String(import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')
  if (apiBase) return apiBase
  if (typeof window === 'undefined') return ''

  const { protocol, hostname, port } = window.location
  const apiPort = String(import.meta.env.VITE_API_PORT || '3001')
  if (port === apiPort) return ''
  if (VITE_PROXY_PORTS.has(port)) return ''
  if (import.meta.env.DEV) {
    return `${protocol}//${hostname}:${apiPort}`
  }
  return ''
}

function isViteDevClient(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(document.querySelector('script[src*="@vite/client"]'))
}

/** 把后端返回的 /uploads 与演示 /assets 转成当前页面能加载的地址 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url?.trim()) return ''
  const value = url.trim()
  if (/^(https?:|data:|blob:)/i.test(value)) return value

  if (value.startsWith('/uploads')) {
    const origin = backendOrigin()
    return origin ? `${origin}${value}` : value
  }

  // Live Server（常见 5500）打开仓库根时，静态文件在 /public/assets 或 /pub/assets
  if (
    value.startsWith('/assets/') &&
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    !VITE_PROXY_PORTS.has(window.location.port) &&
    !isViteDevClient()
  ) {
    return `/public${value}`
  }

  return value
}
