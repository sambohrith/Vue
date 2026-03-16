<template>
  <div class="room-chat-container">
      <!-- 顶部标题栏 -->
      <header class="chat-header">
        <div class="header-left">
          <a-button type="text" shape="circle" @click="goBack">
            <i class="fas fa-arrow-left"></i>
          </a-button>
          <div class="room-info">
            <div class="room-icon" :style="getRoomColor(roomId)">
              {{ roomName?.charAt(0) || '?' }}
            </div>
            <div class="room-details">
              <h2 class="room-name">{{ roomName }}</h2>
              <span class="room-topic">{{ roomDescription || '技术交流、分享心得' }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="online-members-preview">
            <span class="label">在线成员</span>
            <div class="member-avatars">
              <div 
                v-for="(member, idx) in uniqueMembers.slice(0, 3)" 
                :key="member.userId" 
                class="mini-avatar"
                :style="{ ...getUserColor(member.userId), zIndex: 10 - idx }"
              >
                {{ member.userName?.charAt(0) || '?' }}
              </div>
              <div v-if="uniqueMembers.length > 3" class="more-count">
                +{{ uniqueMembers.length - 3 }}
              </div>
            </div>
          </div>
          <a-button type="text" shape="circle" @click="showRoomInfo = true">
            <i class="fas fa-info-circle"></i>
          </a-button>
        </div>
      </header>

      <!-- 主内容区 -->
      <div class="chat-body">
        <!-- 左侧成员列表 -->
        <aside class="members-sidebar">
          <div class="sidebar-title">
            <i class="fas fa-users"></i>
            <span>在线成员 ({{ uniqueMembers.length }})</span>
          </div>
          <div class="members-list">
            <div v-for="member in uniqueMembers" :key="member.userId" class="member-item">
              <div class="member-avatar" :style="getUserColor(member.userId)">
                {{ member.userName?.charAt(0) || '?' }}
                <span class="status-dot online"></span>
              </div>
              <span class="member-name">{{ member.userName || '未知用户' }}</span>
            </div>
            <a-empty v-if="uniqueMembers.length === 0" description="暂无成员" :image="simpleImage" />
          </div>
        </aside>

        <!-- 右侧聊天区域 -->
        <main class="chat-main">
          <!-- 消息列表 -->
          <div ref="messagesContainer" class="messages-area">
            <a-spin :spinning="loading">
              <a-empty v-if="!loading && messages.length === 0" description="暂无消息，来说点什么吧！" />
              <div v-else class="messages-list">
                <div
                  v-for="(message, index) in messages"
                  :key="message.id"
                  class="message-item"
                  :class="{ 'message-own': message.userId === userStore.user?.id }"
                >
                  <!-- 日期分隔线 -->
                  <div v-if="showDateDivider(message, index)" class="date-divider">
                    <span>{{ formatDate(message.createdAt) }}</span>
                  </div>
                  
                  <div class="message-content">
                    <div class="message-avatar" :style="getUserColor(message.userId)">
                      {{ message.userName?.charAt(0) || '?' }}
                    </div>
                    <div class="message-body">
                      <div class="message-header">
                        <span class="author-name">{{ message.userName }}</span>
                        <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                      </div>
                      <div class="message-bubble">
                        {{ message.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a-spin>
          </div>

          <!-- 输入框 -->
          <div class="chat-input-area">
            <div class="input-wrapper">
              <a-input
                v-model:value="messageInput"
                placeholder="输入消息..."
                :maxlength="500"
                @keyup.enter="sendMessage"
              />
              <a-button
                type="primary"
                shape="circle"
                :disabled="!messageInput.trim()"
                @click="sendMessage"
              >
                <i class="fas fa-paper-plane"></i>
              </a-button>
            </div>
          </div>
        </main>
      </div>

      <!-- 房间信息弹窗 -->
      <a-modal v-model:open="showRoomInfo" title="房间信息" width="450px" :footer="null">
        <div class="room-info-modal">
          <div class="info-header">
            <div class="room-icon large" :style="getRoomColor(roomId)">
              {{ roomName?.charAt(0) || '?' }}
            </div>
            <h3>{{ roomName }}</h3>
            <p>{{ roomDescription || '暂无描述' }}</p>
          </div>
          <div class="info-stats">
            <div class="stat-item">
              <i class="fas fa-users"></i>
              <span>{{ uniqueMembers.length }} 成员</span>
            </div>
            <div class="stat-item">
              <i class="fas fa-calendar"></i>
              <span>创建于 {{ roomCreatedAt }}</span>
            </div>
            <div class="stat-item">
              <i class="fas" :class="roomIsPublic ? 'fa-globe' : 'fa-lock'"></i>
              <span>{{ roomIsPublic ? '公开房间' : '私密房间' }}</span>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Empty } from 'ant-design-vue'
// import MainLayout from '@/layouts/MainLayout.vue'
import { useUserStore } from '@/stores/user'
import { roomApi } from '@/api'
import type { RoomMessage } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messagesContainer = ref<HTMLElement | null>(null)

const loading = ref(false)
const showRoomInfo = ref(false)
const messageInput = ref('')
const roomId = ref(Number(route.params.id))
const roomName = ref(route.query.name as string || '房间')

const roomMembers = ref(0)
const roomDescription = ref('')
const roomCreatedAt = ref('')
const roomIsPublic = ref(true)

const messages = ref<RoomMessage[]>([])
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#f6d365', '#fda085']

const getUserColor = (userId: number) => {
  const color = colors[userId % colors.length]
  return { background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }
}

const getRoomColor = (id: number) => {
  const color = colors[id % colors.length]
  return { background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (time: string) => {
  const date = new Date(time)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return '今天'
  if (date.toDateString() === yesterday.toDateString()) return '昨天'
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

const showDateDivider = (message: RoomMessage, index: number) => {
  if (index === 0) return true
  const prevMessage = messages.value[index - 1]
  const prevDate = new Date(prevMessage.createdAt).toDateString()
  const currDate = new Date(message.createdAt).toDateString()
  return prevDate !== currDate
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 从消息中提取唯一成员列表
const uniqueMembers = computed(() => {
  const memberMap = new Map()
  messages.value.forEach(msg => {
    if (!memberMap.has(msg.userId)) {
      memberMap.set(msg.userId, {
        userId: msg.userId,
        userName: msg.userName
      })
    }
  })
  return Array.from(memberMap.values())
})

const loadRoomInfo = async () => {
  try {
    const room = await roomApi.getRoom(roomId.value)
    roomName.value = room.name
    roomDescription.value = room.description || ''
    roomCreatedAt.value = new Date(room.createdAt).toLocaleDateString('zh-CN')
    roomIsPublic.value = room.isPublic
    roomMembers.value = room.memberCount
  } catch (error) {
    console.error('Load room info error:', error)
  }
}

const loadRoomMessages = async () => {
  loading.value = true
  try {
    const response = await roomApi.getRoomMessages(roomId.value)
    messages.value = response.messages
    scrollToBottom()
  } catch (error) {
    console.error('Load room messages error:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/rooms')
}

const sendMessage = async () => {
  if (!messageInput.value.trim()) return
  
  try {
    const newMessage = await roomApi.sendRoomMessage(roomId.value, messageInput.value.trim())
    messages.value.push(newMessage)
    messageInput.value = ''
    scrollToBottom()
  } catch (error) {
    console.error('Send room message error:', error)
  }
}

onMounted(() => {
  loadRoomInfo()
  loadRoomMessages()
})
</script>

<style scoped>
.room-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background: #f5f7fa;
}

/* 顶部标题栏 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.room-details {
  display: flex;
  flex-direction: column;
}

.room-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.room-topic {
  font-size: 13px;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.online-members-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 20px;
}

.online-members-preview .label {
  font-size: 13px;
  color: #6b7280;
}

.member-avatars {
  display: flex;
  align-items: center;
}

.mini-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
  margin-left: -8px;
}

.mini-avatar:first-child {
  margin-left: 0;
}

.more-count {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  border: 2px solid white;
  margin-left: -8px;
}

/* 主内容区 */
.chat-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧成员列表 */
.members-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.sidebar-title i {
  color: #9ca3af;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f3f4f6;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  position: relative;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-dot.online {
  background: #10b981;
}

.member-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

/* 消息区域 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #fafafa;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
}

.date-divider span {
  padding: 4px 16px;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  border-radius: 12px;
}

.message-item {
  display: flex;
  padding: 8px 0;
}

.message-content {
  display: flex;
  gap: 12px;
  max-width: 70%;
}

.message-own .message-content {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-own .message-body {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
}

.message-bubble {
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  word-break: break-word;
}

.message-own .message-bubble {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

/* 输入框 */
.chat-input-area {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-wrapper :deep(.ant-input) {
  border-radius: 24px;
  padding: 12px 20px;
  font-size: 14px;
}

.input-wrapper :deep(.ant-btn) {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 房间信息弹窗 */
.room-info-modal {
  padding: 20px 0;
}

.info-header {
  text-align: center;
  margin-bottom: 24px;
}

.info-header .room-icon.large {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  font-size: 32px;
  margin: 0 auto 16px;
}

.info-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.info-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.info-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;
  font-size: 14px;
  color: #374151;
}

.stat-item i {
  color: #6b7280;
  width: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .members-sidebar {
    display: none;
  }
  
  .online-members-preview .label {
    display: none;
  }
  
  .message-content {
    max-width: 90%;
  }
}
</style>
