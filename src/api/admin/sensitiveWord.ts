import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminSensitiveWordItem {
  id: string
  word: string
  createdAt: string
}

export const getSensitiveWords = (page = 1, pageSize = 20) =>
  request<Paginated<AdminSensitiveWordItem>>({
    url: '/api/admin/sensitive-words',
    method: 'GET',
    params: { page, pageSize },
  })

export const createSensitiveWord = (word: string) =>
  request<{ id: string }>({
    url: '/api/admin/sensitive-words',
    method: 'POST',
    data: { word },
  })

export const deleteSensitiveWord = (id: string) =>
  request<null>({
    url: `/api/admin/sensitive-words/${id}`,
    method: 'DELETE',
  })
