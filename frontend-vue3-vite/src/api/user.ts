import http from './http'

export interface User {
  id: number
  username: string
  fullName: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
  isActive?: boolean
  createdAt?: string
  lastLogin?: string
  phone?: string
  department?: string
  position?: string
  bio?: string
  name?: string
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isActive?: string | boolean
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  limit: number
}

export interface UserStats {
  totalUsers: number
  onlineUsers: number
  adminUsers: number
  activeUsers: number
}

export interface DashboardStats {
  totalUsers: number
  onlineUsers: number
  adminUsers: number
  activeUsers: number
  totalPosts: number
  totalRooms: number
  totalMessages: number
}

export const userApi = {
  getMyInfo() {
    return http.get<User>('/users/me')
  },

  updateMyInfo(data: Partial<User>) {
    return http.put<User>('/users/me', data)
  },

  getContacts() {
    return http.get<User[]>('/contacts')
  },

  getUsers(params: UserListParams = {}) {
    const { page = 1, limit = 10, search = '', role = '', isActive = '' } = params
    const queryParams = new URLSearchParams({ 
      page: page.toString(), 
      limit: limit.toString() 
    })
    if (search) queryParams.append('search', search)
    if (role) queryParams.append('role', role)
    if (isActive !== '') queryParams.append('isActive', isActive.toString())
    
    return http.get<any>(`/users?${queryParams.toString()}`).then(response => {
      return {
        users: response.users,
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit
      }
    })
  },

  getUser(userId: number) {
    return http.get<User>(`/users/${userId}`)
  },

  createUser(data: Partial<User> & { password: string }) {
    return http.post<User>('/users', data)
  },

  updateUser(userId: number, data: Partial<User>) {
    return http.put<User>(`/users/${userId}`, data)
  },

  deleteUser(userId: number) {
    return http.delete(`/users/${userId}`)
  },

  updateUserStatus(userId: number, isActive: boolean) {
    return http.patch(`/users/${userId}/toggle`, { isActive })
  },

  getUserStats() {
    return http.get<UserStats>('/users/stats')
  },

  getDashboardStats() {
    return http.get<DashboardStats>('/dashboard/stats')
  }
}

export default userApi
