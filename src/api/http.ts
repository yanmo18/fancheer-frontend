import axios from 'axios'
import type { ApiResponse } from '@/types/api'
import { notifySessionExpired } from '@/utils/sessionExpired'

const http = axios.create({
  baseURL: '',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

http.defaults.validateStatus = () => true

function requestErrorMessage(status: number, fallback?: string) {
  if (status === 502) {
    return '后端未响应（502），请先运行 start.bat，或在后端目录执行 pnpm dev（默认端口 3001）'
  }
  if (status === 504) {
    return '后端连接超时，请确认 fancheer-backend 已启动'
  }
  return fallback || '请求失败'
}

export async function request<T>(config: Parameters<typeof http.request>[0]): Promise<T> {
  let res
  try {
    res = await http.request<ApiResponse<T>>(config)
  } catch {
    throw new Error('无法连接后端，请先运行 start.bat 启动前后端服务')
  }

  const body = res.data
  if (!body || typeof body !== 'object' || !('code' in body)) {
    throw new Error(requestErrorMessage(res.status))
  }

  if (body.code === 401 || res.status === 401) {
    notifySessionExpired()
    throw new Error(body.msg || '登录已失效，请重新登录')
  }

  if (body.code !== 0) {
    throw new Error(body.msg || requestErrorMessage(res.status))
  }
  return body.data as T
}

export default http
