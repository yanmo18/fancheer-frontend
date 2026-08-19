/** 统一头像 ID / URL 处理，避免 bigint 与字符串比较不一致 */
export function normalizeAvatarId(id?: string | number | null) {
  if (id == null || id === '') return ''
  return String(id)
}

export function isSameAvatarId(a?: string | number | null, b?: string | number | null) {
  const left = normalizeAvatarId(a)
  const right = normalizeAvatarId(b)
  return left !== '' && right !== '' && left === right
}

export function resolveAvatarUrl(...candidates: Array<string | undefined | null>) {
  for (const url of candidates) {
    if (!url?.trim()) continue
    if (url.startsWith('/uploads/')) continue
    return url
  }
  return ''
}
