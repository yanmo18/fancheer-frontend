import axios from 'axios'
import type { ApiResponse } from '@/types/api'
import { notifySessionExpired } from '@/utils/sessionExpired'

// baseURL 默认空：开发走 Vite proxy、生产走 nginx 反代，请求路径都是相对的
// 仅当前后端分域名且不通过反代暴露时，配置 VITE_API_BASE=https://api.example.com
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
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
