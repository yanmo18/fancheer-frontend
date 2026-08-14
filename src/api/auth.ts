import { request } from './http'
import type { CaptchaResult, LoginResult, UserInfo } from '@/types/api'

export const getCaptcha = () =>
  request<CaptchaResult>({ url: '/api/auth/captcha', method: 'GET' })

export const login = (username: string, password: string) =>
  request<LoginResult>({
    url: '/api/auth/login',
    method: 'POST',
    data: { username, password },
  })

export const register = (payload: {
  username: string
  password: string
  captchaId: string
  captchaText: string
  agreement: boolean
}) =>
  request<{ userId: string }>({
    url: '/api/auth/register',
    method: 'POST',
    data: payload,
  })

export const logout = () =>
  request<null>({ url: '/api/auth/logout', method: 'POST' })

export const getMe = () =>
  request<UserInfo>({ url: '/api/auth/me', method: 'GET' })
