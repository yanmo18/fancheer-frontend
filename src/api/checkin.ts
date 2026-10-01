import { request } from './http'

export const checkin = () =>
  request<{ checked: boolean; message: string }>({ url: '/api/checkin', method: 'POST' })

export interface CheckinCalendar {
  year: number
  month: number
  checkedDates: string[]
  /** dateKey(YYYY-MM-DD) → 打卡精确时间 */
  checkedAt?: Record<string, string>
}

export const getCalendar = (year: number, month: number) =>
  request<CheckinCalendar>({
    url: '/api/checkin/calendar',
    method: 'GET',
    params: { year, month },
  })

export interface CheckinStats {
  totalDays: number
  currentStreak: number
  checkedToday: boolean
}

export const getStats = () =>
  request<CheckinStats>({ url: '/api/checkin/stats', method: 'GET' })
