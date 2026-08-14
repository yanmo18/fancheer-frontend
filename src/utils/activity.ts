import { formatDateTime } from './datetime'

export function getActivityStatus(startTime: string, endTime?: string | null): {
  label: string
  tone: 'ongoing' | 'upcoming' | 'ended'
} {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : null

  if (Number.isNaN(start)) {
    return { label: '时间待定', tone: 'upcoming' }
  }
  if (start > now) {
    return { label: '即将开始', tone: 'upcoming' }
  }
  if (end && !Number.isNaN(end) && end < now) {
    return { label: '已结束', tone: 'ended' }
  }
  return { label: '进行中', tone: 'ongoing' }
}

export function formatActivityRange(startTime: string, endTime?: string | null): string {
  const start = formatDateTime(startTime)
  if (!endTime) return `${start} 起`
  return `${start} — ${formatDateTime(endTime)}`
}
