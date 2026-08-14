import http from './http'
import type { ApiResponse } from '@/types/api'

export const uploadImage = async (file: File, category: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('category', category)

  const res = await http.post<ApiResponse<{ url: string }>>('/api/upload/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  if (res.data.code !== 0) {
    throw new Error(res.data.msg || '上传失败')
  }
  return res.data.data.url
}

export const uploadAudio = async (file: File) => {
  const form = new FormData()
  form.append('file', file)

  const res = await http.post<ApiResponse<{ url: string }>>('/api/upload/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  if (res.data.code !== 0) {
    throw new Error(res.data.msg || '上传失败')
  }
  return res.data.data.url
}
