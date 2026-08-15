import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminLogItem {
  id: string
  adminId: string
  adminNickname?: string
  action: string
  targetType: string
  targetId: string
  detail: string
  createdAt: string
}

export interface AdminLogFilters {
  action?: string
  keyword?: string
  operator?: string
  startDate?: string
  endDate?: string
}

export const getAdminLogs = (page = 1, pageSize = 20, filters: AdminLogFilters = {}) =>
  request<Paginated<AdminLogItem>>({
    url: '/api/admin/logs',
    method: 'GET',
    params: {
      page,
      pageSize,
      action: filters.action || undefined,
      keyword: filters.keyword || undefined,
      operator: filters.operator || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  })
