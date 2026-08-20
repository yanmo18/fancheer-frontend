import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { UserInfo, UserRole } from '@/types/api'

const TOKEN_KEY = 'token'
const TOKEN_EXPIRES_AT_KEY = 'tokenExpiresAt'

/** 读取本地存的过期时间戳，不存在或解析失败返回 0 */
function readLocalExpiresAt(): number {
  const raw = localStorage.getItem(TOKEN_EXPIRES_AT_KEY)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** 本地 token 是否已过期；后端黑名单仍是最终权威 */
function isLocalTokenExpired(): boolean {
  const expiresAt = readLocalExpiresAt()
  return expiresAt > 0 && Date.now() >= expiresAt
}

export const useAuthStore = defineStore('auth', () => {
  // 启动时若本地 token 已过期，主动清理，避免发请求再被踢
  if (isLocalTokenExpired()) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  }

  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value && !isLocalTokenExpired())
  const role = computed(() => user.value?.role)
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'streamer')

  function setSession(newToken: string, newUser: UserInfo, expiresIn?: number) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(TOKEN_KEY, newToken)
    // 登录时根据后端返回的 expiresIn 计算本地过期时间戳，仅用于 UX 提前提示
    if (expiresIn && expiresIn > 0) {
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresIn * 1000))
    } else {
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
    }
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  }

  async function login(username: string, password: string) {
    const data = await authApi.login(username, password)
    setSession(data.token, data.user, data.expiresIn)
    return data
  }

  async function fetchMe() {
    if (!token.value || isLocalTokenExpired()) {
      clearSession()
      return null
    }
    try {
      const me = await authApi.getMe()
      user.value = me
      return me
    } catch {
      clearSession()
      return null
    }
  }

  async function logout() {
    try {
      if (token.value) await authApi.logout()
    } finally {
      clearSession()
    }
  }

  function hasRole(roles: UserRole[]) {
    return !!user.value && roles.includes(user.value.role)
  }

  return {
    token,
    user,
    isLoggedIn,
    role,
    isAdmin,
    login,
    fetchMe,
    logout,
    hasRole,
    clearSession,
  }
})
