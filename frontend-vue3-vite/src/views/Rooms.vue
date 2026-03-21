<template>
  <div class="rooms-page">
    <div class="page-header-section">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">
            <i class="fas fa-door-open"></i>
            <span>圈子房间</span>
          </h1>
          <p class="page-subtitle">发现有趣的圈子，与志同道合的人交流</p>
        </div>
        <a-button type="primary" class="create-btn" @click="showCreateRoomModal = true">
          <i class="fas fa-plus"></i>
          创建房间
        </a-button>
      </div>
    </div>

    <div class="rooms-content">
      <div class="tabs-header">
        <div class="tabs-nav">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </div>
        </div>
      </div>

      <div class="tab-content">
        <div v-show="activeTab === 'my-rooms'" class="tab-panel">
          <div class="rooms-grid">
            <a-spin :spinning="loading">
              <a-empty v-if="!loading && myRooms.length === 0" description="你还没有加入任何房间" />
              <div v-else class="grid-container">
                <div v-for="room in myRooms" :key="room.id" class="room-card" @click="enterRoom(room.id, room.name)">
                  <div class="card-header">
                    <div class="room-icon">
                      {{ getInitials(room.name) }}
                    </div>
                    <div class="room-status" :class="{ active: room.isPublic }"></div>
                  </div>
                  <div class="card-body">
                    <h4 class="room-name">{{ room.name }}</h4>
                    <p class="room-desc">{{ room.description || '暂无描述' }}</p>
                  </div>
                  <div class="card-footer">
                    <span class="stat">
                      <i class="fas fa-users"></i>
                      {{ room.memberCount }}
                    </span>
                    <span class="stat">
                      <i class="fas fa-comment"></i>
                      {{ room.messageCount || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </a-spin>
          </div>
        </div>

        <div v-show="activeTab === 'public-rooms'" class="tab-panel">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索房间..."
              class="search-input"
            />
          </div>
          <div class="rooms-grid">
            <a-spin :spinning="loading">
              <a-empty v-if="!loading && filteredPublicRooms.length === 0" description="暂无公开房间" />
              <div v-else class="grid-container">
                <div v-for="room in filteredPublicRooms" :key="room.id" class="room-card">
                  <div class="card-header">
                    <div class="room-icon" :style="getRandomColor(room.id)">
                      {{ getInitials(room.name) }}
                    </div>
                    <div class="room-status active"></div>
                  </div>
                  <div class="card-body">
                    <h4 class="room-name">{{ room.name }}</h4>
                    <p class="room-desc">{{ room.description || '暂无描述' }}</p>
                  </div>
                  <div class="card-footer">
                    <span class="stat">
                      <i class="fas fa-users"></i>
                      {{ room.memberCount }}
                    </span>
                    <a-button type="primary" class="join-btn" size="small" @click.stop="joinRoom(room.id)">
                      加入
                    </a-button>
                  </div>
                </div>
              </div>
            </a-spin>
          </div>
        </div>

        <div v-show="activeTab === 'join-room'" class="tab-panel">
          <div class="join-room-container">
            <div class="join-card">
              <div class="join-icon">
                <i class="fas fa-key"></i>
              </div>
              <h3>通过邀请码加入</h3>
              <p>输入6位邀请码加入私密房间</p>
              <div class="join-form">
                <input
                  v-model="inviteCode"
                  type="text"
                  placeholder="请输入邀请码"
                  :maxlength="6"
                  class="code-input"
                />
                <a-button
                  type="primary"
                  size="large"
                  class="join-submit-btn"
                  :disabled="!inviteCode.trim()"
                  @click="joinRoomByCode"
                  block
                >
                  <i class="fas fa-sign-in-alt"></i>
                  加入房间
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-modal v-model:open="showCreateRoomModal" title="创建新房间" width="480px" :footer="null">
      <div class="create-room-content">
        <div class="preview-icon" :style="{ background: getPreviewColor }">
          {{ getInitials(newRoom.name) }}
        </div>
        <a-form @submit.prevent="createRoom" layout="vertical">
          <a-form-item label="房间名称" required>
            <a-input v-model:value="newRoom.name" placeholder="给房间起个名字" />
          </a-form-item>
          <a-form-item label="房间描述">
            <a-textarea
              v-model:value="newRoom.description"
              :rows="3"
              placeholder="简单描述一下这个房间..."
            />
          </a-form-item>
          <a-form-item>
            <div class="public-toggle">
              <span>公开房间</span>
              <a-switch v-model:checked="newRoom.isPublic" />
            </div>
            <div class="toggle-hint">{{ newRoom.isPublic ? '所有人都可以发现和加入' : '只有被邀请的人可以加入' }}</div>
          </a-form-item>
          <div class="form-footer">
            <a-button @click="showCreateRoomModal = false">取消</a-button>
            <a-button type="primary" :loading="loading" @click="createRoom">
              创建房间
            </a-button>
          </div>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { roomApi } from '@/api'
import { getInitials } from '@/utils'
import type { Room } from '@/types'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('my-rooms')
const searchQuery = ref('')
const inviteCode = ref('')
const showCreateRoomModal = ref(false)

const tabs = [
  { key: 'my-rooms', label: '我的房间', icon: 'fas fa-home' },
  { key: 'public-rooms', label: '公开房间', icon: 'fas fa-globe' },
  { key: 'join-room', label: '加入房间', icon: 'fas fa-key' }
]

const newRoom = ref({
  name: '',
  description: '',
  isPublic: true
})

const myRooms = ref<Room[]>([])
const publicRooms = ref<Room[]>([])

const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a']

const getRandomColor = (id: number) => {
  const color = colors[id % colors.length]
  return { background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` }
}

const getPreviewColor = computed(() => {
  const color = colors[newRoom.value.name.length % colors.length]
  return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
})

const filteredPublicRooms = computed(() => {
  if (!searchQuery.value) return publicRooms.value
  const query = searchQuery.value.toLowerCase()
  return publicRooms.value.filter(room =>
    room.name.toLowerCase().includes(query) ||
    (room.description && room.description.toLowerCase().includes(query))
  )
})

const loadMyRooms = async () => {
  loading.value = true
  try {
    const response = await roomApi.getMyRooms()
    myRooms.value = response.rooms
  } catch (error) {
    console.error('Load my rooms error:', error)
  } finally {
    loading.value = false
  }
}

const loadPublicRooms = async () => {
  loading.value = true
  try {
    const response = await roomApi.getPublicRooms()
    publicRooms.value = response.rooms
  } catch (error) {
    console.error('Load public rooms error:', error)
  } finally {
    loading.value = false
  }
}

const enterRoom = (roomId: number, roomName: string) => {
  router.push(`/room/${roomId}?name=${roomName}`)
}

const joinRoom = async (roomId: number) => {
  try {
    await roomApi.joinRoom(roomId)
    await loadMyRooms()
    await loadPublicRooms()
  } catch (error: any) {
    console.error('Join room error:', error)
  }
}

const joinRoomByCode = async () => {
  if (!inviteCode.value.trim()) return

  try {
    await roomApi.joinRoomByCode(inviteCode.value.trim())
    inviteCode.value = ''
    await loadMyRooms()
  } catch (error: any) {
    console.error('Join room by code error:', error)
  }
}

const createRoom = async () => {
  if (!newRoom.value.name.trim()) return

  loading.value = true
  try {
    const room = await roomApi.createRoom(newRoom.value)

    myRooms.value.push(room)
    if (room.isPublic) {
      publicRooms.value.push(room)
    }

    showCreateRoomModal.value = false
    newRoom.value = {
      name: '',
      description: '',
      isPublic: true
    }
  } catch (error: any) {
    console.error('Create room error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMyRooms()
  loadPublicRooms()
})
</script>

<style scoped>
.rooms-page {
  width: 100%;
  min-height: 100%;
}

.page-header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px 32px;
  color: white;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

.page-header-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title i {
  font-size: 20px;
}

.page-subtitle {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}

.create-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.rooms-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.tabs-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.tabs-nav {
  display: flex;
  gap: 8px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  transition: all 0.3s ease;
}

.tab-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-item i {
  font-size: 14px;
}

.tab-content {
  padding: 20px;
}

.search-box {
  position: relative;
  max-width: 400px;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.rooms-grid {
  min-height: 400px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.room-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #e5e7eb;
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.room-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.room-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px white;
}

.room-status.active {
  background: #3b82f6;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-body {
  margin-bottom: 16px;
}

.room-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.join-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
}

.join-btn:hover {
  transform: scale(1.05);
}

.join-room-container {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.join-card {
  text-align: center;
  max-width: 360px;
}

.join-icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 24px;
}

.join-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.join-card p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.code-input {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
  font-weight: 600;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
}

.code-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.join-submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.create-room-content {
  padding: 20px 0;
}

.preview-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  margin: 0 auto 24px;
}

.public-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.toggle-hint {
  font-size: 12px;
  color: #9ca3af;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .create-btn {
    align-self: flex-end;
  }

  .tabs-nav {
    flex-wrap: wrap;
  }

  .tab-item {
    padding: 8px 16px;
    font-size: 13px;
  }

  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
