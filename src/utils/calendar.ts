export interface CalendarCell {
  date: string | null
  day: number | null
}

export function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getTodayKey() {
  const now = new Date()
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
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
