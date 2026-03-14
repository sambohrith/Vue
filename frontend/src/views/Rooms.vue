<template>
  <MainLayout>
    <div class="rooms-page">
      <div class="rooms-header">
        <a-button type="primary" class="create-btn" @click="showCreateRoomModal = true">
          <i class="fas fa-plus"></i>
          创建房间
        </a-button>
      </div>

      <div class="rooms-content">
        <a-tabs v-model:activeKey="activeTab" class="custom-tabs">
          <a-tab-pane key="my-rooms" tab="我的房间">
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
          </a-tab-pane>

          <a-tab-pane key="public-rooms" tab="公开房间">
            <div class="search-box">
              <a-input
                v-model:value="searchQuery"
                placeholder="搜索房间..."
                allow-clear
              >
                <template #prefix>
                  <i class="fas fa-search"></i>
                </template>
              </a-input>
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
                      <a-button type="primary" size="small" @click.stop="joinRoom(room.id)">
                        加入
                      </a-button>
                    </div>
                  </div>
                </div>
              </a-spin>
            </div>
          </a-tab-pane>

          <a-tab-pane key="join-room" tab="加入房间">
            <div class="join-room-container">
              <div class="join-card">
                <div class="join-icon">
                  <i class="fas fa-key"></i>
                </div>
                <h3>通过邀请码加入</h3>
                <p>输入6位邀请码加入私密房间</p>
                <a-form @submit.prevent="joinRoomByCode" class="join-form">
                  <a-input
                    v-model:value="inviteCode"
                    placeholder="请输入邀请码"
                    :max-length="6"
                    class="code-input"
                  />
                  <a-button
                    type="primary"
                    size="large"
                    :disabled="!inviteCode.trim()"
                    @click="joinRoomByCode"
                    block
                  >
                    <i class="fas fa-sign-in-alt mr-1"></i>
                    加入房间
                  </a-button>
                </a-form>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 创建房间弹窗 -->
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
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { roomApi } from '@/api'
import { getInitials } from '@/utils'
import type { Room } from '@/types'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('my-rooms')
const searchQuery = ref('')
const inviteCode = ref('')
const showCreateRoomModal = ref(false)

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
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.create-btn {
  border-radius: 8px;
}

/* 标签页样式 */
.rooms-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.custom-tabs :deep(.ant-tabs-nav) {
  padding: 0 24px;
  margin-bottom: 0;
}

.custom-tabs :deep(.ant-tabs-tab) {
  padding: 16px 0;
}

.custom-tabs :deep(.ant-tabs-content) {
  padding: 24px;
}

/* 搜索框 */
.search-box {
  max-width: 400px;
  margin-bottom: 20px;
}

/* 网格布局 */
.rooms-grid {
  min-height: 400px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

/* 房间卡片 */
.room-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  border-color: #e0e7ff;
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

/* 加入房间 */
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
}

/* 创建房间弹窗 */
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

/* 响应式 */
@media (max-width: 768px) {
  .rooms-page {
    padding: 16px;
  }
  
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
  
  .rooms-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
