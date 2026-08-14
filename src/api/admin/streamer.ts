import { request } from '../http'

export interface AdminStreamerInfo {
  id: string
  name: string
  avatarUrl: string
  tags: string
  bio: string
  createdAt?: string
  updatedAt?: string
}

export interface StreamerPayload {
  name?: string
  avatarUrl?: string
  tags?: string
  bio?: string
}

export const getAdminStreamerInfo = () =>
  request<AdminStreamerInfo | null>({
    url: '/api/admin/streamer-info',
    method: 'GET',
  })

export const updateStreamerInfo = (data: StreamerPayload) =>
  request<null>({
    url: '/api/admin/streamer-info',
    method: 'PUT',
    data,
  })
