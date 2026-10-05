export interface CalendarCell {
  date: string | null
  day: number | null
}

export function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** 与后端一致：按 Asia/Shanghai 日历日，避免跨时区「今天」错位 */
export function getTodayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return formatDateKey(year, month, day)
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: CalendarCell[] = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ date: null, day: null })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: formatDateKey(year, month, day), day })
  }

  return cells
}

export function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
}

/** 活动跨天：按上海日历列出闭区间内每一天 */
export function eachDateKeyInclusive(startIso: string, endIso?: string | null) {
  const start = new Date(startIso)
  if (Number.isNaN(start.getTime())) return []
  const parsedEnd = endIso ? new Date(endIso) : start
  const end = Number.isNaN(parsedEnd.getTime()) ? start : parsedEnd
  const startKey = getTodayKey(start)
  const endKey = getTodayKey(end)
  const [sy, sm, sd] = startKey.split('-').map(Number)
  const [ey, em, ed] = endKey.split('-').map(Number)
  const cursor = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  if (last < cursor) return [startKey]
  const keys: string[] = []
  while (cursor <= last) {
    keys.push(formatDateKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}
