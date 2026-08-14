import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminAvatarItem {
  id: string
  url: string
  sortOrder: number
  createdAt: string
}

export const getAdminAvatars = (page = 1, pageSize = 20) =>
  request<Paginated<AdminAvatarItem>>({
    url: '/api/admin/avatars',
    method: 'GET',
    params: { page, pageSize },
  })

export const createAvatar = (url: string, sortOrder = 0) =>
  request<{ id: string }>({
    url: '/api/admin/avatars',
    method: 'POST',
    data: { url, sortOrder },
  })

export const deleteAvatar = (id: string) =>
  request<null>({ url: `/api/admin/avatars/${id}`, method: 'DELETE' })
