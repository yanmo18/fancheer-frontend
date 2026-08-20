import http from './http'
import type { ApiResponse } from '@/types/api'

// 与后端 fancheer-backend/src/services/upload.service.ts 保持一致
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a']

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

/** 客户端预检：在发请求前拦截超大或类型不符的文件，省一次网络往返 */
function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(getExt(file.name))) {
    throw new Error('仅支持 jpg / png / webp / gif 格式')
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('图片不能超过 10MB')
  }
}

function validateAudioFile(file: File) {
  if (!ALLOWED_AUDIO_EXTENSIONS.includes(getExt(file.name))) {
    throw new Error('仅支持 mp3 / wav / ogg / m4a 格式')
  }
  if (file.size > MAX_AUDIO_SIZE) {
    throw new Error('音频不能超过 50MB')
  }
}

export const uploadImage = async (file: File, category: string) => {
  validateImageFile(file)

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
  validateAudioFile(file)

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
