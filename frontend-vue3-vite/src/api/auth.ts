import http from './http'
import { storage } from '@/utils'
import { STORAGE_KEYS } from '@/constants'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    username: string
    fullName: string
    email: string
    role: 'admin' | 'user'
  }
}

export const authApi = {
  validateToken() {
    return http.get('/auth/me')
  },

  login(credentials: LoginCredentials) {
    return http.post<AuthResponse>('/auth/login', credentials)
  },

  register(userData: RegisterData) {
    return http.post<AuthResponse>('/auth/register', userData)
  },

  logout() {
    storage.remove(STORAGE_KEYS.TOKEN)
    storage.remove(STORAGE_KEYS.USER_ROLE)
    storage.remove(STORAGE_KEYS.USER_INFO)
    return Promise.resolve({ success: true })
  }
}

export default authApi
