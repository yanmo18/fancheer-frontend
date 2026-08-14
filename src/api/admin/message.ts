import { request } from '../http'
import type { Paginated } from './banner'

export interface AdminMessageItem {
  id: string
  senderId: string
  senderNickname: string
  senderUsername?: string
  senderRole?: string
  content: string
  type: 'public' | 'private'
  likeCount: number
  createdAt: string
}

export const getPublicMessages = (page = 1, pageSize = 20, keyword?: string) =>
  request<Paginated<AdminMessageItem>>({
    url: '/api/admin/messages/public',
    method: 'GET',
    params: { page, pageSize, keyword: keyword || undefined },
  })

export const getPrivateMessages = (page = 1, pageSize = 20, userId?: string) =>
  request<Paginated<AdminMessageItem>>({
    url: '/api/admin/messages/private',
    method: 'GET',
    params: { page, pageSize, userId: userId || undefined },
  })

export const deleteMessage = (id: string) =>
  request<null>({ url: `/api/admin/messages/${id}`, method: 'DELETE' })
