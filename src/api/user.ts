import { request } from './http'

export interface AvatarItem {
  id: string
  url: string
}

export const updateNickname = (nickname: string) =>
  request<null>({
    url: '/api/user/nickname',
    method: 'PUT',
    data: { nickname },
  })

export const updateAvatar = (avatarId: string) =>
  request<null>({
    url: '/api/user/avatar',
    method: 'PUT',
    data: { avatarId },
  })

export const changePassword = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) =>
  request<null>({
    url: '/api/user/password',
    method: 'PUT',
    data: { currentPassword, newPassword, confirmPassword },
  })

export const getAvatars = () =>
  request<AvatarItem[]>({ url: '/api/user/avatars', method: 'GET' })
