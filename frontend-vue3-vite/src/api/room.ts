import http from './http'

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
  page: number
  limit: number
}

export interface CreateRoomData {
  name: string
  description?: string
  isPublic: boolean
}

export interface UpdateRoomData {
  name?: string
  description?: string
  isPublic?: boolean
}

export const roomApi = {
  getMyRooms() {
    return http.get<RoomListResponse>('/social/rooms/my')
  },

  getPublicRooms() {
    return http.get<RoomListResponse>('/social/rooms/public')
  },

  getRoom(roomId: number) {
    return http.get<Room>(`/social/rooms/${roomId}`)
  },

  createRoom(data: CreateRoomData) {
    return http.post<Room>('/social/rooms', data)
  },

  updateRoom(roomId: number, data: UpdateRoomData) {
    return http.put<Room>(`/social/rooms/${roomId}`, data)
  },

  deleteRoom(roomId: number) {
    return http.delete(`/social/rooms/${roomId}`)
  },

  joinRoom(roomId: number) {
    return http.post(`/social/rooms/${roomId}/join`)
  },

  joinRoomByCode(inviteCode: string) {
    return http.post('/social/rooms/join-by-code', { inviteCode })
  },

  leaveRoom(roomId: number) {
    return http.post(`/social/rooms/${roomId}/leave`)
  },

  getRoomMembers(roomId: number) {
    return http.get<MemberListResponse>(`/social/rooms/${roomId}/members`)
  },

  addRoomMember(roomId: number, userId: number) {
    return http.post(`/social/rooms/${roomId}/members`, { userId })
  },

  removeRoomMember(roomId: number, userId: number) {
    return http.delete(`/social/rooms/${roomId}/members/${userId}`)
  },

  getRoomMessages(roomId: number, params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params || {}
    return http.get<MessageListResponse>(`/social/rooms/${roomId}/messages?page=${page}&limit=${limit}`)
  },

  sendRoomMessage(roomId: number, content: string) {
    return http.post<RoomMessage>(`/social/rooms/${roomId}/messages`, { content })
  },

  deleteRoomMessage(roomId: number, messageId: number) {
    return http.delete(`/social/rooms/${roomId}/messages/${messageId}`)
  }
}

export default roomApi
