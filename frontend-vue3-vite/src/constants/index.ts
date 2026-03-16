// 全局常量定义

// 应用信息
export const APP_NAME = '信息管理系统'
export const APP_VERSION = '1.0.0'

// 分页配置
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_ROLE: 'userRole',
  USER_INFO: 'userInfo',
  THEME: 'theme',
  LANGUAGE: 'language',
  CHAT_CONTACTS: 'chat_contacts'
} as const

// 路由名称
export const ROUTE_NAMES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  DASHBOARD: 'Dashboard',
  PROFILE: 'Profile',
  CONTACTS: 'Contacts',
  CHAT: 'Chat',
  POSTS: 'Posts',
  ROOMS: 'Rooms',
  ROOM_CHAT: 'RoomChat',
  USERS: 'Users',
  SETTINGS: 'Settings'
} as const

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const

// 消息类型
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file'
} as const

// 聊天消息状态
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
} as const

// HTTP 状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
} as const

// 主题
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const

// 日期格式
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm',
  MONTH: 'yyyy-MM'
} as const

// 文件上传限制
export const UPLOAD_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  FILE_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const

// 正则表达式
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,20}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/
} as const

// 缓存过期时间（毫秒）
export const CACHE_EXPIRY = {
  CHAT_CONTACTS: 5 * 60 * 1000, // 5分钟
  USER_INFO: 30 * 60 * 1000,    // 30分钟
  SETTINGS: 60 * 60 * 1000      // 1小时
} as const
