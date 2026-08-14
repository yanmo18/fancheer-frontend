import { request } from '../http'
import type { Paginated } from './banner'
import type { UserRole } from '@/types/api'

export type UserStatus = 'active' | 'banned'

export interface AdminUserItem {
  id: string
  username: string
  nickname: string
  avatar?: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

export const getAdminUsers = (params: {
  page?: number
  pageSize?: number
  role?: string
  status?: string
  keyword?: string
} = {}) =>
  request<Paginated<AdminUserItem>>({
    url: '/api/admin/users',
    method: 'GET',
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      role: params.role || undefined,
      status: params.status || undefined,
      keyword: params.keyword || undefined,
    },
  })

export const banUser = (id: string) =>
  request<null>({ url: `/api/admin/users/${id}/ban`, method: 'PUT' })

export const unbanUser = (id: string) =>
  request<null>({ url: `/api/admin/users/${id}/unban`, method: 'PUT' })

export const updateUserRole = (id: string, role: 'admin' | 'fan') =>
  request<null>({ url: `/api/admin/users/${id}/role`, method: 'PUT', data: { role } })
