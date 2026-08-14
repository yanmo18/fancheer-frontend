import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminSongItem {
  id: string
  title: string
  artist?: string
  audioUrl: string
  coverUrl?: string
  sortOrder: number
  createdAt?: string
}

export interface SongPayload {
  title: string
  artist?: string
  audioUrl: string
  coverUrl?: string
  sortOrder?: number
}

export const getAdminSongs = (page = 1, pageSize = 20) =>
  request<Paginated<AdminSongItem>>({
    url: '/api/admin/songs',
    method: 'GET',
    params: { page, pageSize },
  })

export const createSong = (data: SongPayload) =>
  request<{ id: string }>({ url: '/api/admin/songs', method: 'POST', data })

export const updateSong = (id: string, data: Partial<SongPayload>) =>
  request<null>({ url: `/api/admin/songs/${id}`, method: 'PUT', data })

export const deleteSong = (id: string) =>
  request<null>({ url: `/api/admin/songs/${id}`, method: 'DELETE' })
