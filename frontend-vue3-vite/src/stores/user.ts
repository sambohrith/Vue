import { defineStore } from 'pinia'
import type { User } from '@/types'
import { authApi, userApi } from '@/api'
import { storage } from '@/utils'
import { STORAGE_KEYS, USER_ROLES } from '@/constants'

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: null,
    isLoggedIn: false,
    loading: false
  }),

  getters: {
    isAdmin: (state): boolean => state.user?.role === USER_ROLES.ADMIN,
    userName: (state): string => state.user?.fullName || state.user?.username || '用户',
    userId: (state): number | null => state.user?.id || null,
    hasPermission: (state) => (role: string): boolean => {
      if (!state.user) return false
      if (state.user.role === USER_ROLES.ADMIN) return true
      return state.user.role === role
    }
  },

  actions: {
    setUser(user: User) {
      this.user = user
      storage.set(STORAGE_KEYS.USER_INFO, user)
    },

    setToken(token: string, role: string) {
      this.token = token
      this.isLoggedIn = true
      storage.set(STORAGE_KEYS.TOKEN, token)
      storage.set(STORAGE_KEYS.USER_ROLE, role)
    },

    logout() {
      this.user = null
      this.token = null
      this.isLoggedIn = false
      storage.remove(STORAGE_KEYS.TOKEN)
      storage.remove(STORAGE_KEYS.USER_ROLE)
      storage.remove(STORAGE_KEYS.USER_INFO)
    },

    async login(username: string, password: string): Promise<boolean> {
      this.loading = true
      try {
        const response = await authApi.login({ username, password })
        this.setToken(response.token, response.user.role)
        this.setUser(response.user)
        return true
      } catch (error: any) {
        console.error('Login error:', error)
        // 抛出错误让调用方处理
        throw new Error(error.message || '登录失败')
      } finally {
        this.loading = false
      }
    },

    async register(
      username: string, 
      password: string, 
      name: string, 
      email: string
    ): Promise<boolean> {
      this.loading = true
      try {
        const response = await authApi.register({ username, password, name, email })
        this.setToken(response.token, response.user.role)
        this.setUser(response.user)
        return true
      } catch (error) {
        console.error('Register error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUserInfo(): Promise<User | null> {
      try {
        const user = await userApi.getMyInfo()
        this.setUser(user)
        return user
      } catch (error) {
        console.error('Fetch user info error:', error)
        this.logout()
        throw error
      }
    },

    // 从本地存储恢复用户状态
    restoreFromStorage(): boolean {
      const token = storage.get<string>(STORAGE_KEYS.TOKEN, null)
      const userInfo = storage.get<User>(STORAGE_KEYS.USER_INFO, null)
      
      if (token && userInfo) {
        this.token = token
        this.user = userInfo
        this.isLoggedIn = true
        return true
      }
      return false
    }
  }
})
