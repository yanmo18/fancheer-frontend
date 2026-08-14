import { request } from './http'

export const checkin = () =>
  request<{ checked: boolean; message: string }>({ url: '/api/checkin', method: 'POST' })

export interface CheckinCalendar {
  year: number
  month: number
  checkedDates: string[]
}

export const getCalendar = (year: number, month: number) =>
  request<CheckinCalendar>({
    url: '/api/checkin/calendar',
    method: 'GET',
    params: { year, month },
  })
