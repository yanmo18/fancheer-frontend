import { request } from '../http'
import type { Paginated } from './banner'

export type ReportStatus = 'pending' | 'resolved'

export interface AdminReportItem {
  id: string
  reporterId: string
  reporterNickname: string
  messageId: string
  messageContent: string
  messageType: string
  messageSenderId?: string | null
  messageSenderNickname: string
  reason: string
  status: ReportStatus
  createdAt: string
  resolvedAt?: string | null
}

export interface AdminReportDetail extends AdminReportItem {
  reporterUsername: string
  messageSenderUsername: string
  messageCreatedAt: string | null
  messageLikeCount: number
  relatedReportCount: number
}

export const getPendingReports = (page = 1, pageSize = 20) =>
  request<Paginated<AdminReportItem>>({
    url: '/api/admin/reports/pending',
    method: 'GET',
    params: { page, pageSize },
  })

export const getResolvedReports = (page = 1, pageSize = 20) =>
  request<Paginated<AdminReportItem>>({
    url: '/api/admin/reports/resolved',
    method: 'GET',
    params: { page, pageSize },
  })

export const getReportDetail = (id: string) =>
  request<AdminReportDetail>({
    url: `/api/admin/reports/${id}`,
    method: 'GET',
  })

export const resolveReport = (id: string) =>
  request<null>({ url: `/api/admin/reports/${id}/resolve`, method: 'PUT' })

export const deleteViolationMessage = (id: string) =>
  request<null>({ url: `/api/admin/reports/${id}/message`, method: 'DELETE' })
