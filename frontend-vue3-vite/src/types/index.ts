// 全局类型定义

// ============ 用户相关 ============
export interface User {
  id: number
  username: string
  fullName: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
  isActive?: boolean
  status?: boolean
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string
  lastLogin?: string
  phone?: string
  department?: string
  position?: string
  bio?: string
  name?: string
}

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
  user: User
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  totalPages: number
}

export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isActive?: string | boolean
}

// ============ 说说/动态相关 ============
export interface Post {
  id: number
  content: string
  userId: number
  userName: string
  userAvatar?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  likes: number
  comments: number
  images?: string[]
  isLiked?: boolean
}

export interface PostComment {
  id: number
  content: string
  userId: number
  userName: string
  userAvatar?: string
  postId: number
  createdAt: string
}

export interface CreatePostData {
  content: string
  isPublic?: boolean
  images?: string[]
}

export interface PostListResponse {
  posts: Post[]
  total: number
  hasMore: boolean
}

export interface CommentListResponse {
  comments: PostComment[]
  total: number
}

// ============ 房间/圈子相关 ============
export interface Room {
  id: number
  name: string
  description?: string
  isPublic: boolean
  ownerId: number
  ownerName: string
  memberCount: number
  inviteCode?: string
  createdAt: string
  updatedAt?: string
  messageCount?: number
}

export interface RoomMember {
  id: number
  roomId: number
  userId: number
  userName: string
  userAvatar?: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

export interface RoomMessage {
  id: number
  content: string
  userId: number
  userName: string
  userAvatar?: string
  roomId: number
  createdAt: string
}

export interface CreateRoomData {
  name: string
  description?: string
  isPublic?: boolean
}

export interface UpdateRoomData {
  name?: string
  description?: string
  isPublic?: boolean
}

export interface RoomListResponse {
  rooms: Room[]
  total: number
}

export interface MemberListResponse {
  members: RoomMember[]
  total: number
}

export interface MessageListResponse {
  messages: RoomMessage[]
  total: number
}

// ============ 聊天相关 ============
export interface ChatMessage {
  id: number
  content: string
  senderId: number
  senderName: string
  receiverId: number
  receiverName: string
  isRead: boolean
  createdAt: string
  updatedAt?: string
}

export interface Contact {
  id: number
  userId: number
  name: string
  email: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isOnline?: boolean
}

export interface Conversation {
  key: string
  user1Id: number
  user1Name: string
  user2Id: number
  user2Name: string
  messageCount: number
  lastMessage: string
  lastMessageTime?: string
}

export interface SendMessageData {
  receiverId: number
  content: string
}

export interface ChatListResponse {
  contacts: Contact[]
  total: number
}

export interface ChatMessageListResponse {
  messages: ChatMessage[]
  total: number
  hasMore: boolean
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
}

// ============ 系统设置相关 ============
export interface Settings {
  siteName: string
  siteLogo: string
  siteDescription: string
  passwordMinLength: number
  loginAttempts: number
  enable2FA: boolean
  enableIPRestriction: boolean
  enableEmailNotifications: boolean
  enableSystemNotifications: boolean
  notificationEmail: string
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupRetention: number
}

export type SystemSettings = Settings

export interface BackupResponse {
  url: string
  filename: string
  size: number
  createdAt: string
}

// ============ 仪表盘统计相关 ============
export interface DashboardStats {
  totalUsers: number
  onlineUsers: number
  adminUsers: number
  activeUsers: number
  totalPosts: number
  totalRooms: number
  totalMessages: number
}

export interface UserStats {
  unreadCount: number
  chatCount: number
  registerDate: string
  lastLogin: string
}

// ============ 路由相关 ============
export interface RouteMeta {
  requiresAuth?: boolean
  requiresAdmin?: boolean
  guest?: boolean
  title?: string
  icon?: string
  hidden?: boolean
}

// ============ API 响应相关 ============
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  code?: number
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============ 文件上传相关 ============
export interface UploadFile {
  uid: string
  name: string
  status: 'uploading' | 'done' | 'error'
  url?: string
  thumbUrl?: string
  response?: any
}

// ============ 主题相关 ============
export type Theme = 'light' | 'dark' | 'auto'

// ============ 通用分页参数 ============
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ============ 搜索参数 ============
export interface SearchParams extends PaginationParams {
  keyword?: string
  filters?: Record<string, any>
}
