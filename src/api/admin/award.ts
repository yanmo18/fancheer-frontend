import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminAwardItem {
  id: string
  title: string
  description?: string
  imageUrl?: string
  awardDate?: string | null
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface AwardPayload {
  title: string
  description?: string
  imageUrl?: string
  awardDate?: string | null
  sortOrder?: number
}

export const getAdminAwards = (page = 1, pageSize = 20) =>
  request<Paginated<AdminAwardItem>>({
    url: '/api/admin/awards',
    method: 'GET',
    params: { page, pageSize },
  })

export const createAward = (data: AwardPayload) =>
  request<{ id: string }>({ url: '/api/admin/awards', method: 'POST', data })

export const updateAward = (id: string, data: Partial<AwardPayload>) =>
  request<null>({ url: `/api/admin/awards/${id}`, method: 'PUT', data })

export const deleteAward = (id: string) =>
  request<null>({ url: `/api/admin/awards/${id}`, method: 'DELETE' })
