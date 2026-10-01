/**
 * 把接口返回的最新一页合并进已有列表：新 id 插到前面，已有项用服务端数据覆盖。
 */
export function mergeByIdNewestFirst<T extends { id: string | number }>(
  current: T[],
  newestPage: T[],
  keepLocal?: (id: string) => boolean,
): T[] {
  const currentIds = new Set(current.map((item) => String(item.id)))
  const incoming = newestPage.filter((item) => !currentIds.has(String(item.id)))
  const newestMap = new Map(newestPage.map((item) => [String(item.id), item]))
  const patched = current.map((item) => {
    const id = String(item.id)
    const fresh = newestMap.get(id)
    if (!fresh || keepLocal?.(id)) return item
    return fresh
  })
  return incoming.length ? [...incoming, ...patched] : patched
}
