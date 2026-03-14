import http from './http'

export interface ChatMessage {
  id: number
  content: string
  senderId: number
  senderName: string
  receiverId: number
  receiverName: string
  isRead: boolean
  createdAt: string
}

export interface ChatContact {
  id: number
  userId: number
  name: string
  email: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export interface ChatListResponse {
  contacts: ChatContact[]
  total: number
}

export interface ChatMessageListResponse {
  messages: ChatMessage[]
  total: number
  page: number
  limit: number
}

export interface SendMessageData {
  receiverId: number
  content: string
}

export const chatApi = {
  getChatList() {
    return http.get<ChatListResponse>('/chat/list')
  },

  getMessages(userId: number, params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params || {}
    return http.get<ChatMessageListResponse>(`/chat/history/${userId}?page=${page}&limit=${limit}`)
  },

  sendMessage(data: SendMessageData) {
    return http.post<ChatMessage>('/chat/send', data)
  },

  markAsRead(userId: number) {
    return http.put(`/chat/read/${userId}`)
  },

  getGlobalUnread() {
    return http.get<{ unreadCount: number }>('/chat/unread')
  },

  getAllMessages(params?: { search?: string; page?: number; limit?: number }) {
    const { search = '', page = 1, limit = 50 } = params || {}
    const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (search) queryParams.append('search', search)
    
    return http.get<{ messages: ChatMessage[]; total: number }>(`/chat/admin/messages?${queryParams.toString()}`)
  },

  getAllConversations(params?: { search?: string; page?: number; limit?: number }) {
    const { search = '', page = 1, limit = 50 } = params || {}
    const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (search) queryParams.append('search', search)
    
    return http.get<{ conversations: ChatContact[]; total: number }>(`/chat/admin/conversations?${queryParams.toString()}`)
  }
}

export default chatApi
