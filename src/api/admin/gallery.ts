import { request } from '../http'

export type GalleryCategory = 'anime' | 'real'

export interface AdminGalleryItem {
  id: string
  imageUrl: string
  title?: string
  category: GalleryCategory
  sortOrder: number
  createdAt?: string
}

export interface GalleryPayload {
  imageUrl: string
  category: GalleryCategory
  title?: string
  sortOrder?: number
}

export interface AdminGalleryResult {
  list: AdminGalleryItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  stats: {
    anime: number
    real: number
  }
}

export const getAdminGallery = (page = 1, pageSize = 20) =>
  request<AdminGalleryResult>({
    url: '/api/admin/gallery',
    method: 'GET',
    params: { page, pageSize },
  })

export const createGalleryImage = (data: GalleryPayload) =>
  request<{ id: string }>({ url: '/api/admin/gallery', method: 'POST', data })

export const updateGalleryImage = (id: string, data: Partial<GalleryPayload>) =>
  request<null>({ url: `/api/admin/gallery/${id}`, method: 'PUT', data })

export const deleteGalleryImage = (id: string) =>
  request<null>({ url: `/api/admin/gallery/${id}`, method: 'DELETE' })
