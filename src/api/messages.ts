import { request } from './http'
import type { MessageItem, Paginated, PrivateReplyItem, PublicReplyItem } from '@/types/api'

export const getPublicMessages = (params?: { before?: string; limit?: number }) =>
  request<MessageItem[]>({
    url: '/api/messages/public',
    method: 'GET',
    params,
  })

export const getPublicReplies = (params?: { before?: string; limit?: number }) =>
  request<PublicReplyItem[]>({
    url: '/api/messages/public-replies',
    method: 'GET',
    params,
  })

export const getPrivateReplies = (page = 1, pageSize = 20) =>
  request<Paginated<PrivateReplyItem>>({
    url: '/api/messages/private',
    method: 'GET',
    params: { page, pageSize },
  })

export const sendMessage = (content: string, type: 'public' | 'private') =>
  request<{ id: string }>({
    url: '/api/messages',
    method: 'POST',
    data: { content, type },
  })

export const likeMessage = (id: string) =>
  request<null>({ url: `/api/messages/${id}/like`, method: 'POST' })

export const unlikeMessage = (id: string) =>
  request<null>({ url: `/api/messages/${id}/like`, method: 'DELETE' })

export const reportMessage = (id: string, reason: string) =>
  request<{ reportId: string }>({
    url: `/api/messages/${id}/report`,
    method: 'POST',
    data: { reason },
  })
