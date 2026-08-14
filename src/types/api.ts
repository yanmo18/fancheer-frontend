export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export type UserRole = 'fan' | 'admin' | 'streamer'

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  avatarUrl?: string
  avatarId?: string | null
  role: UserRole
}

export interface LoginResult {
  token: string
  expiresIn: number
  user: UserInfo
}

export interface CaptchaResult {
  svg: string
  captchaId: string
}

export interface StreamerInfo {
  name: string
  avatarUrl: string
  tags: string | string[]
  bio: string
}

export interface BannerItem {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  sortOrder: number
}

export interface AwardItem {
  id: string
  title: string
  description?: string
  imageUrl?: string
  awardDate?: string
}

export interface SongItem {
  id: string
  title: string
  artist?: string
  audioUrl: string
  coverUrl?: string
}

export interface ActivityItem {
  id: string
  title: string
  description?: string
  coverUrl?: string
  startTime: string
  endTime?: string
}

export interface GalleryItem {
  id: string
  category: 'anime' | 'real'
  imageUrl: string
  title?: string
}

export interface GraphCharacter {
  id: string
  name: string
  avatarUrl?: string
  bio?: string
  isCenter: boolean
  sortOrder?: number
}

export interface GraphRelation {
  id: string
  fromCharacterId: string
  toCharacterId: string
  relationLabel: string
  sortOrder?: number
}

export interface GraphData {
  characters: GraphCharacter[]
  relations: GraphRelation[]
}

export interface MessageItem {
  id: string
  content: string
  type: 'public' | 'private'
  likeCount: number
  createdAt: string
  senderNickname?: string
  senderAvatar?: string
  liked?: boolean
  isLiked?: boolean
}

export interface PublicReplyItem {
  id: string
  messageId: string
  originalContent: string
  streamerNickname: string
  streamerAvatar?: string
  content: string
  createdAt: string
}

export interface PrivateReplyItem {
  id: string
  messageId: string
  originalContent: string
  streamerNickname: string
  streamerAvatar?: string
  content: string
  createdAt: string
}

export interface Paginated<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
