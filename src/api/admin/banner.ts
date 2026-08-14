import { request } from '../http'
import type { BannerItem } from '@/types/api'

export interface Paginated<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface AdminBannerItem extends BannerItem {
  isVisible: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BannerPayload {
  title?: string
  imageUrl: string
  linkUrl?: string
  sortOrder?: number
  isVisible?: boolean
}

export const getAdminBanners = (page = 1, pageSize = 20) =>
  request<Paginated<AdminBannerItem>>({
    url: '/api/admin/banners',
    method: 'GET',
    params: { page, pageSize },
  })

export const createBanner = (data: BannerPayload) =>
  request<{ id: string }>({
    url: '/api/admin/banners',
    method: 'POST',
    data,
  })

export const updateBanner = (id: string, data: Partial<BannerPayload>) =>
  request<null>({
    url: `/api/admin/banners/${id}`,
    method: 'PUT',
    data,
  })

export const deleteBanner = (id: string) =>
  request<null>({
    url: `/api/admin/banners/${id}`,
    method: 'DELETE',
  })
