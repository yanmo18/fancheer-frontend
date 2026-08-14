import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { UserInfo, UserRole } from '@/types/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role)
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'streamer')

  function setSession(newToken: string, newUser: UserInfo) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  async function login(username: string, password: string) {
    const data = await authApi.login(username, password)
    setSession(data.token, data.user)
    return data
  }

  async function fetchMe() {
    if (!token.value) return null
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
