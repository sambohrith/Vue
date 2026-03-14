<template>
  <MainLayout>
    <div class="chat-page">
      <!-- 普通用户聊天界面 -->
      <div v-if="!isAdmin" class="chat-container">
        <div class="chat-list">
          <div class="chat-list-header">
            <h3 class="chat-list-title">聊天对象</h3>
            <div class="chat-list-search">
              <a-input
                v-model:value="searchQuery"
                placeholder="搜索聊天对象..."
                size="small"
                id="chat-search"
              >
                <template #prefix>
                  <i class="fas fa-search text-gray-400"></i>
                </template>
              </a-input>
              <a-button
                id="chat-refresh-btn"
                shape="circle"
                size="small"
                @click="refreshChats"
                title="刷新列表"
              >
                <i class="fas fa-sync"></i>
              </a-button>
            </div>
          </div>
          <div class="chat-list-body">
            <a-spin :spinning="loading">
              <a-empty v-if="!loading && (!contacts || contacts.length === 0)" description="暂无聊天对象" />
              <div v-else class="chat-item" v-for="contact in filteredContacts" :key="contact.id" @click="selectContact(contact)" :class="{ active: selectedContact?.id === contact.id }">
                <div class="relative">
                  <a-badge :count="contact.unreadCount" :offset="[-2, 2]">
                    <a-avatar :size="48" class="chat-avatar">
                      {{ contact.name?.charAt(0) || '?' }}
                    </a-avatar>
                  </a-badge>
                  <div class="status-indicator" v-if="contact.isOnline !== false"></div>
                </div>
                <div class="contact-info">
                  <div class="contact-header">
                    <h4 class="truncate">{{ contact.name }}</h4>
                    <span class="last-message-time">{{ contact.lastMessageTime }}</span>
                  </div>
                  <p class="last-message truncate">{{ contact.lastMessage }}</p>
                </div>
              </div>
            </a-spin>
          </div>
        </div>
        <div class="chat-window">
          <div class="chat-window-header">
            <div class="chat-contact-info">
              <a-avatar :size="40" class="chat-avatar">
                {{ selectedContact?.name?.charAt(0) || '?' }}
              </a-avatar>
              <div class="contact-details">
                <h3 id="chat-contact-name">{{ selectedContact?.name || '选择聊天对象' }}</h3>
                <p id="chat-contact-status" v-if="selectedContact">
                  <span class="status-dot"></span>
                  在线
                </p>
              </div>
            </div>
            <div class="chat-actions">
              <a-button shape="circle" size="small">
                <i class="fas fa-phone"></i>
              </a-button>
              <a-button shape="circle" size="small">
                <i class="fas fa-video"></i>
              </a-button>
              <a-button shape="circle" size="small">
                <i class="fas fa-ellipsis-v"></i>
              </a-button>
            </div>
          </div>
          <div 
            id="chat-messages" 
            class="chat-messages"
            @scroll="handleMessageScroll"
          >
            <div v-if="!selectedContact" class="chat-empty">
              <i class="fas fa-comments"></i>
              <p>请选择一个聊天对象开始对话</p>
            </div>
            <div v-else>
              <div v-if="messageLoading" class="loading-more">
                <i class="fas fa-sync fa-spin"></i>
                <span>加载更多消息...</span>
              </div>
              
              <div class="message-list">
                <div v-for="message in messages" :key="message.id" class="message-item" :class="{ 'own-message': message.senderId === userStore.user?.id }">
                  <a-avatar v-if="message.senderId !== userStore.user?.id" :size="36" class="chat-avatar">
                    {{ getSenderName(message)?.charAt(0) || '?' }}
                  </a-avatar>
                  <div class="message-content">
                    <div class="message-text" :class="{ 'own': message.senderId === userStore.user?.id }">
                      {{ message.content }}
                    </div>
                    <div class="message-time">{{ formatTime(message.createdAt) }}</div>
                  </div>
                  <a-avatar v-if="message.senderId === userStore.user?.id" :size="36" class="chat-avatar">
                    {{ userStore.user?.fullName?.charAt(0) || '?' }}
                  </a-avatar>
                </div>
              </div>
              
              <div v-if="!messageLoading && !messageHasMore && messages.length > 0" class="no-more">
                没有更多消息了
              </div>
            </div>
          </div>
          <div v-if="selectedContact" class="chat-input-area">
            <a-textarea
              id="chat-input"
              v-model:value="messageInput"
              :rows="1"
              placeholder="输入消息..."
              @keyup.enter.ctrl="sendMessage"
              class="chat-textarea"
            />
            <a-button 
              id="send-message-btn" 
              type="primary" 
              shape="circle"
              @click="sendMessage"
              :disabled="!messageInput.trim()"
            >
              <i class="fas fa-paper-plane"></i>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 管理员聊天监控界面 -->
      <div v-else class="admin-monitor">
        <!-- 页面头部 -->
        <div class="monitor-header">
          <div class="header-left">
            <h2 class="header-title">
              <i class="fas fa-shield-alt text-indigo-500"></i>
              聊天监控
            </h2>
            <p class="header-subtitle">实时查看所有用户对话记录，确保沟通合规</p>
          </div>
          <div class="header-actions">
            <div class="stat-box">
              <div class="stat-label">活跃对话</div>
              <div class="stat-value">{{ conversations.length }}<span class="stat-unit">个</span></div>
            </div>
            <a-button type="primary" shape="circle" size="large" @click="refreshAdminConversations" :loading="adminLoading">
              <i class="fas fa-sync"></i>
            </a-button>
          </div>
        </div>

        <!-- 监控主内容区 -->
        <div class="monitor-content">
          <!-- 左侧对话列表 -->
          <div class="conversation-panel">
            <div class="panel-header">
              <div class="panel-header-row">
                <div class="panel-title">
                  <i class="fas fa-comments text-indigo-500"></i>
                  <span>对话列表</span>
                  <a-tag color="indigo" class="count-badge">{{ filteredConversations.length }}</a-tag>
                </div>
                <div class="panel-filters">
                  <a-input
                    v-model:value="adminSearchQuery"
                    placeholder="搜索用户或消息..."
                    size="small"
                    allow-clear
                    @input="handleAdminSearch"
                    style="width: 140px"
                  >
                    <template #prefix>
                      <i class="fas fa-search"></i>
                    </template>
                  </a-input>
                  <a-select
                    v-model:value="selectedUserFilter"
                    placeholder="筛选用户"
                    size="small"
                    allow-clear
                    style="width: 110px"
                  >
                    <a-select-option v-for="user in allUsers" :key="user.id" :value="user.id">
                      {{ user.fullName || user.username }}
                    </a-select-option>
                  </a-select>
                </div>
              </div>
            </div>
            <div class="conversation-list" v-loading="adminLoading">
              <a-empty v-if="!adminLoading && filteredConversations.length === 0" description="暂无对话" />
              <div v-else class="conversation-items">
                <div
                  v-for="conv in filteredConversations"
                  :key="conv.key"
                  class="conversation-item"
                  :class="{ active: selectedConversation?.key === conv.key }"
                  @click="selectConversation(conv)"
                >
                  <div class="conv-avatars">
                    <a-avatar class="conv-avatar primary" :size="40">
                      {{ conv.user1Name?.charAt(0) || '?' }}
                    </a-avatar>
                    <a-avatar class="conv-avatar secondary" :size="32">
                      {{ conv.user2Name?.charAt(0) || '?' }}
                    </a-avatar>
                  </div>
                  <div class="conv-info">
                    <div class="conv-names">
                      <span class="name">{{ conv.user1Name }}</span>
                      <span class="divider">与</span>
                      <span class="name">{{ conv.user2Name }}</span>
                    </div>
                    <div class="conv-preview">{{ conv.lastMessage || '暂无消息' }}</div>
                  </div>
                  <div class="conv-meta">
                    <a-tag size="small" class="msg-count">{{ conv.messageCount }}条</a-tag>
                    <i class="fas fa-chevron-right arrow"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧消息详情 -->
          <div class="message-panel">
            <div v-if="selectedConversation" class="panel-header message-header">
              <div class="header-users">
                <div class="user-pair">
                  <a-avatar class="chat-avatar" :size="36">{{ selectedConversation.user1Name?.charAt(0) }}</a-avatar>
                  <span class="user-name">{{ selectedConversation.user1Name }}</span>
                </div>
                <span class="vs">与</span>
                <div class="user-pair">
                  <a-avatar class="chat-avatar" :size="36">{{ selectedConversation.user2Name?.charAt(0) }}</a-avatar>
                  <span class="user-name">{{ selectedConversation.user2Name }}</span>
                </div>
              </div>
              <a-button danger size="small" @click="clearConversation">
                <i class="fas fa-trash-alt mr-1"></i>
                清空对话
              </a-button>
            </div>
            <div v-else class="panel-header message-header empty">
              <i class="fas fa-info-circle text-gray-400"></i>
              <span>选择左侧对话查看详情</span>
            </div>

            <div class="message-content-area">
              <div v-if="!selectedConversation" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-comments"></i>
                </div>
                <p>选择左侧对话查看聊天内容</p>
              </div>
              <div v-else-if="adminMessages.length === 0" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-inbox"></i>
                </div>
                <p>该对话暂无消息</p>
              </div>
              <div v-else class="message-timeline">
                <div v-for="(msg, index) in adminMessages" :key="msg.id" class="message-group">
                  <div v-if="showTimeDivider(msg, index)" class="time-divider">
                    <span>{{ formatDateTime(msg.createdAt) }}</span>
                  </div>
                  <div class="message-bubble" :class="{ 'is-self': msg.senderId === selectedConversation.user1Id }">
                    <a-avatar class="chat-avatar" :size="32">
                      {{ getSenderName(msg)?.charAt(0) || '?' }}
                    </a-avatar>
                    <div class="bubble-content">
                      <div class="bubble-header">
                        <span class="sender-name">{{ getSenderName(msg) }}</span>
                        <span class="send-time">{{ formatTime(msg.createdAt) }}</span>
                      </div>
                      <div class="bubble-body">{{ msg.content }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useUserStore } from '../stores/user'
import { chatApi, userApi } from '../api'
import type { Contact, ChatMessage, Conversation } from '../types'
import { message, Modal } from 'ant-design-vue'

const userStore = useUserStore()
const isAdmin = computed(() => {
  return userStore.isAdmin || localStorage.getItem('userRole') === 'admin'
})

// ============ 普通用户相关 ============
const loading = ref(false)
const searchQuery = ref('')
const selectedContact = ref<Contact | null>(null)
const messageInput = ref('')
const contacts = ref<Contact[]>([])
const messages = ref<ChatMessage[]>([])

const messageLoading = ref(false)
const messagePage = ref(1)
const messageHasMore = ref(true)
const messageLimit = 20

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value || []
  const query = searchQuery.value.toLowerCase()
  return (contacts.value || []).filter(contact => 
    contact.name?.toLowerCase().includes(query) ||
    contact.email?.toLowerCase().includes(query)
  )
})

const refreshChats = async (forceRefresh = false) => {
  loading.value = true
  try {
    if (!forceRefresh) {
      const cachedData = getCachedChats()
      if (cachedData) {
        contacts.value = cachedData
        updateChatsInBackground()
        loading.value = false
        return
      }
    }
    const response = await chatApi.getChatList()
    contacts.value = response.contacts
    cacheChats(response.contacts)
  } catch (error) {
    console.error('Refresh chats error:', error)
    const cachedData = getCachedChats()
    if (cachedData) contacts.value = cachedData
  } finally {
    loading.value = false
  }
}

const updateChatsInBackground = async () => {
  try {
    const response = await chatApi.getChatList()
    contacts.value = response.contacts
    cacheChats(response.contacts)
  } catch (error) {
    console.error('Background update error:', error)
  }
}

const CACHE_KEY = 'chat_contacts'
const CACHE_EXPIRY = 5 * 60 * 1000

const cacheChats = (data: Contact[]) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
}

const getCachedChats = (): Contact[] | null => {
  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return null
  try {
    const cacheData = JSON.parse(cached)
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return cacheData.data
  } catch {
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

const selectContact = async (contact: Contact) => {
  selectedContact.value = contact
  messagePage.value = 1
  messageHasMore.value = true
  messages.value = []
  try {
    await loadMessages(contact.userId, 1)
    if (contact.unreadCount > 0) {
      await chatApi.markAsRead(contact.userId)
      contact.unreadCount = 0
    }
  } catch (error) {
    console.error('Load messages error:', error)
  }
}

const loadMessages = async (userId: number, page: number) => {
  if (messageLoading.value || !messageHasMore.value) return
  messageLoading.value = true
  try {
    const response = await chatApi.getMessages(userId, { page, limit: messageLimit })
    if (page === 1) messages.value = response.messages
    else messages.value = [...messages.value, ...response.messages]
    messageHasMore.value = response.messages.length === messageLimit
  } catch (error) {
    console.error('Load messages error:', error)
  } finally {
    messageLoading.value = false
  }
}

const loadMoreMessages = async () => {
  if (selectedContact.value && messageHasMore.value) {
    messagePage.value++
    await loadMessages(selectedContact.value.userId, messagePage.value)
  }
}

const handleMessageScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.scrollTop < 50 && messageHasMore.value && !messageLoading.value) {
    loadMoreMessages()
  }
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || !selectedContact.value) return
  try {
    const newMessage = await chatApi.sendMessage({
      receiverId: selectedContact.value.userId,
      content: messageInput.value.trim()
    })
    messages.value.push(newMessage)
    messageInput.value = ''
    const contact = contacts.value.find(c => c.userId === selectedContact.value?.userId)
    if (contact) {
      contact.lastMessage = newMessage.content
      contact.lastMessageTime = formatTime(newMessage.createdAt)
    }
  } catch (error) {
    console.error('Send message error:', error)
    message.error('发送消息失败')
  }
}

// ============ 管理员相关 ============
const adminLoading = ref(false)
const adminSearchQuery = ref('')
const selectedUserFilter = ref<number | null>(null)
const conversations = ref<Conversation[]>([])
const selectedConversation = ref<Conversation | null>(null)
const adminMessages = ref<ChatMessage[]>([])
const allUsers = ref<any[]>([])

const filteredConversations = computed(() => {
  let result = conversations.value
  if (adminSearchQuery.value) {
    const query = adminSearchQuery.value.toLowerCase()
    result = result.filter(conv => 
      conv.user1Name.toLowerCase().includes(query) ||
      conv.user2Name.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    )
  }
  if (selectedUserFilter.value) {
    const userId = selectedUserFilter.value
    result = result.filter(conv => conv.user1Id === userId || conv.user2Id === userId)
  }
  return result
})

const refreshAdminConversations = async () => {
  adminLoading.value = true
  try {
    const response = await chatApi.getAllConversations()
    conversations.value = (response.conversations || []).map((conv: any) => ({
      ...conv,
      key: `${conv.user1Id}-${conv.user2Id}`
    }))
    try {
      const usersResponse = await userApi.getContacts()
      allUsers.value = (usersResponse as any).users || []
    } catch (e) {
      console.log('Load users for filter skipped')
    }
  } catch (error) {
    console.error('Refresh admin conversations error:', error)
    message.error('获取对话列表失败')
  } finally {
    adminLoading.value = false
  }
}

const selectConversation = async (conv: Conversation) => {
  selectedConversation.value = conv
  try {
    const response = await chatApi.getAllMessages({ search: adminSearchQuery.value })
    adminMessages.value = response.messages.filter((msg: any) => {
      const msgKey1 = `${msg.senderId}-${msg.receiverId}`
      const msgKey2 = `${msg.receiverId}-${msg.senderId}`
      return msgKey1 === conv.key || msgKey2 === conv.key
    }).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } catch (error) {
    console.error('Load conversation messages error:', error)
    message.error('获取消息失败')
  }
}

const handleAdminSearch = () => {
  refreshAdminConversations()
}

const clearConversation = async () => {
  if (!selectedConversation.value) return
  Modal.confirm({
    title: '清空对话',
    content: '确定要清空该对话的所有消息记录吗？此操作不可恢复！',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      message.success('对话记录已清空')
      adminMessages.value = []
    }
  })
}

const getSenderName = (msg: ChatMessage) => {
  if (!selectedContact.value && !selectedConversation.value) return '未知'
  if (selectedContact.value) return msg.senderId === userStore.user?.id ? userStore.user?.fullName : selectedContact.value.name
  if (selectedConversation.value) {
    return msg.senderId === selectedConversation.value.user1Id 
      ? selectedConversation.value.user1Name 
      : selectedConversation.value.user2Name
  }
  return '未知'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const showTimeDivider = (msg: ChatMessage, index: number) => {
  if (index === 0) return true
  const prevMsg = adminMessages.value[index - 1]
  const timeDiff = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
  return timeDiff > 5 * 60 * 1000
}

onMounted(() => {
  console.log('[Chat] onMounted, isAdmin:', isAdmin.value)
  if (isAdmin.value) {
    console.log('[Chat] Loading admin conversations...')
    refreshAdminConversations()
  } else {
    refreshChats()
  }
})
</script>

<style scoped>
/* ============ 通用样式 ============ */
.chat-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.chat-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

/* ============ 普通用户聊天样式 ============ */
.chat-container {
  display: flex;
  height: calc(100vh - 140px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-list {
  width: 320px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.chat-list-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.chat-list-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
}

.chat-list-search {
  display: flex;
  gap: 8px;
}

.chat-list-body {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.chat-item:hover {
  background: #f5f5f5;
}

.chat-item.active {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.status-indicator {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
  position: absolute;
  top: 0;
  right: 0;
  border: 2px solid white;
}

.contact-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.contact-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.last-message-time {
  font-size: 12px;
  color: #9ca3af;
}

.last-message {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 聊天窗口 */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-window-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.chat-contact-info {
  display: flex;
  align-items: center;
}

.contact-details {
  margin-left: 12px;
}

.contact-details h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.contact-details p {
  font-size: 12px;
  color: #10b981;
  margin: 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.chat-empty i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 60%;
  display: flex;
  flex-direction: column;
}

.message-item.own-message .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
}

.message-text.own {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: white;
}

.chat-textarea {
  flex: 1;
  border-radius: 8px;
}

.loading-more {
  text-align: center;
  padding: 12px;
  color: #6b7280;
}

.no-more {
  text-align: center;
  padding: 12px;
  color: #9ca3af;
  font-size: 12px;
}

/* ============ 管理员监控样式 ============ */
.admin-monitor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-box {
  text-align: right;
  padding-right: 8px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #4f46e5;
  line-height: 1.2;
}

.stat-unit {
  font-size: 14px;
  font-weight: 400;
  color: #6b7280;
  margin-left: 2px;
}

/* 监控内容区 */
.monitor-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 260px);
}

.conversation-panel {
  width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
  flex-shrink: 0;
}

.count-badge {
  margin-left: 4px;
}

.panel-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.conversation-item.active {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.conv-avatars {
  position: relative;
  width: 50px;
  height: 44px;
  flex-shrink: 0;
}

.conv-avatar {
  position: absolute;
  border: 2px solid white;
}

.conv-avatar.primary {
  top: 0;
  left: 0;
  z-index: 2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.conv-avatar.secondary {
  bottom: 0;
  right: 0;
  z-index: 1;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.conv-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.conv-names {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.conv-names .name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.conv-names .divider {
  color: #9ca3af;
  font-size: 12px;
}

.conv-preview {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.msg-count {
  background: #e0e7ff;
  color: #4f46e5;
  border: none;
}

.arrow {
  font-size: 14px;
  color: #9ca3af;
  transition: all 0.2s;
}

/* 消息详情区 */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message-header.empty {
  justify-content: center;
  color: #9ca3af;
  gap: 8px;
}

.header-users {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-pair {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-pair .user-name {
  font-weight: 600;
  color: #1f2937;
}

.vs {
  color: #9ca3af;
  font-size: 12px;
}

.message-content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon i {
  font-size: 36px;
  color: #9ca3af;
}

.message-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-divider {
  text-align: center;
  margin: 8px 0;
}

.time-divider span {
  display: inline-block;
  padding: 4px 12px;
  background: white;
  border-radius: 12px;
  font-size: 12px;
  color: #6b7280;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-bubble {
  display: flex;
  gap: 12px;
  max-width: 70%;
}

.message-bubble.is-self {
  flex-direction: row-reverse;
  margin-left: auto;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble.is-self .bubble-content {
  align-items: flex-end;
}

.bubble-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.sender-name {
  font-weight: 600;
  color: #1f2937;
}

.send-time {
  color: #9ca3af;
}

.bubble-body {
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
}

.message-bubble.is-self .bubble-body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 响应式 */
@media (max-width: 1024px) {
  .monitor-content {
    flex-direction: column;
    height: auto;
  }
  
  .conversation-panel {
    width: 100%;
    max-height: 400px;
  }
  
  .message-panel {
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
  }
  
  .chat-list {
    width: 100%;
    height: 300px;
  }
  
  .monitor-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
