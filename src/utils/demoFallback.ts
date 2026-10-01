/** 开发默认开启演示兜底；生产构建默认关闭，避免空数据被假内容顶上 */
export function isDemoFallbackEnabled() {
  const flag = import.meta.env.VITE_ENABLE_DEMO_FALLBACK
  if (flag === 'false') return false
  if (flag === 'true') return true
  return import.meta.env.DEV
}

export interface DemoFallbackOptions {
  /** 为 true 时，API 失败或返回空数据则使用演示内容 */
  allowFallback?: boolean
}

export function shouldApplyDemoFallback(options?: DemoFallbackOptions) {
  return options?.allowFallback !== false && isDemoFallbackEnabled()
}

export function isDemoItemId(id: string | number | undefined) {
  return String(id ?? '').startsWith('demo-')
}
