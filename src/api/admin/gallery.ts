import { request } from '../http'
import type { Paginated } from './banner'

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

export const getAdminGallery = (page = 1, pageSize = 20) =>
  request<Paginated<AdminGalleryItem>>({
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
