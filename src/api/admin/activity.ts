import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminActivityItem {
  id: string
  title: string
  description?: string
  coverUrl?: string
  startTime: string
  endTime?: string | null
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface ActivityPayload {
  title: string
  description?: string
  coverUrl?: string
  startTime: string
  endTime?: string | null
  sortOrder?: number
}

export const getAdminActivities = (page = 1, pageSize = 20) =>
  request<Paginated<AdminActivityItem>>({
    url: '/api/admin/activities',
    method: 'GET',
    params: { page, pageSize },
  })

export const createActivity = (data: ActivityPayload) =>
  request<{ id: string }>({ url: '/api/admin/activities', method: 'POST', data })

export const updateActivity = (id: string, data: Partial<ActivityPayload>) =>
  request<null>({ url: `/api/admin/activities/${id}`, method: 'PUT', data })

export const deleteActivity = (id: string) =>
  request<null>({ url: `/api/admin/activities/${id}`, method: 'DELETE' })
