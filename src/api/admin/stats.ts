import { request } from '../http'

export interface AdminDashboardStats {
  pendingReports: number
  publicMessages: number
  publicMessagesToday: number
  privateMessages: number | null
  users: number
  fans: number
  bannedUsers: number
  checkinsToday: number
  banners: number
  gallery: number
  songs: number
  activities: number
  ongoingActivities: number
}

export const getDashboardStats = () =>
  request<AdminDashboardStats>({ url: '/api/admin/stats', method: 'GET' })
