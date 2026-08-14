import { request } from './http'
import type {
  ActivityItem,
  AwardItem,
  BannerItem,
  GalleryItem,
  SongItem,
  StreamerInfo,
} from '@/types/api'

export const getBanners = () =>
  request<BannerItem[]>({ url: '/api/banners', method: 'GET' })

export const getStreamerInfo = () =>
  request<StreamerInfo>({ url: '/api/streamer-info', method: 'GET' })

export const getAwards = () =>
  request<AwardItem[]>({ url: '/api/awards', method: 'GET' })

export const getSongs = () =>
  request<SongItem[]>({ url: '/api/songs', method: 'GET' })

export const getActivities = () =>
  request<ActivityItem[]>({ url: '/api/activities', method: 'GET' })

export const getGallery = (category?: string) =>
  request<GalleryItem[]>({
    url: '/api/gallery',
    method: 'GET',
    params: category ? { category } : undefined,
  })

export interface GraphData {
  characters: Array<{
    id: string
    name: string
    avatarUrl?: string
    bio?: string
    isCenter: boolean
  }>
  relations: Array<{
    id: string
    fromCharacterId: string
    toCharacterId: string
    relationLabel: string
  }>
}

export const getGraph = () =>
  request<GraphData>({ url: '/api/graph', method: 'GET' })
