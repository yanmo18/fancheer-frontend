/** 首页演示兜底开关，生产环境可设 VITE_ENABLE_DEMO_FALLBACK=false 关闭 */
export function isDemoFallbackEnabled() {
  return import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== 'false'
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
