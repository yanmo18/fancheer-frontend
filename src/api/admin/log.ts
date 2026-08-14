import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminLogItem {
  id: string
  adminId: string
  action: string
  targetType: string
  targetId: string
  detail: string
  createdAt: string
}

export const getAdminLogs = (page = 1, pageSize = 20) =>
  request<Paginated<AdminLogItem>>({
    url: '/api/admin/logs',
    method: 'GET',
    params: { page, pageSize },
  })
