<template>
  <MainLayout>
    <div class="dashboard-page p-6">
      <!-- 欢迎信息 -->
      <div class="welcome-banner mb-6">
        <p class="text-gray-600">欢迎回来，<span id="welcome-name">{{ userName }}</span>！</p>
      </div>
      
      <!-- 管理员统计卡片区域 -->
      <div v-if="isAdmin" class="dashboard-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <a-card :hoverable="true" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <i class="fas fa-user text-xl"></i>
            </div>
            <div class="stat-info">
              <h3 id="total-users" class="stat-number">{{ stats.totalUsers }}</h3>
              <p class="stat-label">总用户数</p>
            </div>
          </div>
        </a-card>
        <a-card :hoverable="true" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online">
              <i class="fas fa-plug text-xl"></i>
            </div>
            <div class="stat-info">
              <h3 id="online-users" class="stat-number">{{ stats.onlineUsers }}</h3>
              <p class="stat-label">当前在线</p>
            </div>
          </div>
        </a-card>
        <a-card :hoverable="true" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon admins">
              <i class="fas fa-user-shield text-xl"></i>
            </div>
            <div class="stat-info">
              <h3 id="admin-users" class="stat-number">{{ stats.adminUsers }}</h3>
              <p class="stat-label">管理员</p>
            </div>
          </div>
        </a-card>
        <a-card :hoverable="true" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">
              <i class="fas fa-check-circle text-xl"></i>
            </div>
            <div class="stat-info">
              <h3 id="active-users" class="stat-number">{{ stats.activeUsers }}</h3>
              <p class="stat-label">活跃用户</p>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 普通用户欢迎卡片 -->
      <div v-else class="dashboard-row grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <a-card :hoverable="true" class="welcome-card" title="欢迎使用">
          <template #extra>
            <i class="fas fa-star text-amber-500"></i>
          </template>
          <div class="welcome-content text-center">
            <div class="welcome-icon">
              <i class="fas fa-comments text-3xl"></i>
            </div>
            <h4 class="text-xl font-semibold text-gray-800 mb-4">开始与同事交流</h4>
            <p class="text-gray-600 mb-6">您可以使用聊天功能与其他用户进行实时沟通，点击下方的"进入聊天"按钮开始。</p>
            <router-link to="/chat">
              <a-button type="primary">
                <i class="fas fa-comments mr-2"></i>
                进入聊天
              </a-button>
            </router-link>
          </div>
        </a-card>

        <a-card :hoverable="true" class="my-stats" title="我的统计">
          <template #extra>
            <i class="fas fa-chart-pie text-blue-500"></i>
          </template>
          <div class="stat-list flex flex-col gap-4">
            <div class="stat-list-item flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="stat-label flex items-center gap-2 text-gray-600 text-sm">
                <i class="fas fa-envelope"></i>
                未读消息
              </span>
              <span class="stat-value font-semibold text-gray-800 text-sm" id="user-unread-count">{{ userStats.unreadCount }}</span>
            </div>
            <div class="stat-list-item flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="stat-label flex items-center gap-2 text-gray-600 text-sm">
                <i class="fas fa-comments"></i>
                对话数量
              </span>
              <span class="stat-value font-semibold text-gray-800 text-sm" id="user-chat-count">{{ userStats.chatCount }}</span>
            </div>
            <div class="stat-list-item flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="stat-label flex items-center gap-2 text-gray-600 text-sm">
                <i class="fas fa-calendar"></i>
                注册时间
              </span>
              <span class="stat-value font-semibold text-gray-800 text-sm" id="user-register-date">{{ userStats.registerDate }}</span>
            </div>
            <div class="stat-list-item flex justify-between items-center p-3 bg-gray-50 rounded">
              <span class="stat-label flex items-center gap-2 text-gray-600 text-sm">
                <i class="fas fa-clock"></i>
                最后登录
              </span>
              <span class="stat-value font-semibold text-gray-800 text-sm" id="user-last-login">{{ userStats.lastLogin }}</span>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 管理员功能卡片 -->
      <div v-if="isAdmin" class="dashboard-row grid grid-cols-1 md:grid-cols-3 gap-6">
        <a-card :hoverable="true" class="feature-card" title="用户管理">
          <template #extra>
            <i class="fas fa-users text-blue-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">管理系统用户，添加、编辑、禁用用户账号</p>
            <router-link to="/users">
              <a-button type="primary">
                <i class="fas fa-arrow-right mr-2"></i>
                进入管理
              </a-button>
            </router-link>
          </div>
        </a-card>

        <a-card :hoverable="true" class="feature-card" title="系统设置">
          <template #extra>
            <i class="fas fa-cog text-green-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">配置系统参数、安全策略、数据备份</p>
            <router-link to="/settings">
              <a-button type="primary">
                <i class="fas fa-arrow-right mr-2"></i>
                进入设置
              </a-button>
            </router-link>
          </div>
        </a-card>

        <a-card :hoverable="true" class="feature-card" title="聊天监控">
          <template #extra>
            <i class="fas fa-eye text-purple-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">查看所有用户的聊天记录，确保沟通合规</p>
            <router-link to="/chat">
              <a-button type="primary">
                <i class="fas fa-arrow-right mr-2"></i>
                查看记录
              </a-button>
            </router-link>
          </div>
        </a-card>
      </div>

      <!-- 普通用户功能卡片 -->
      <div v-else class="dashboard-row grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a-card :hoverable="true" class="feature-card" title="消息中心">
          <template #extra>
            <i class="fas fa-comments text-blue-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">与同事进行实时聊天沟通</p>
            <router-link to="/chat">
              <a-button type="primary">
                <i class="fas fa-arrow-right mr-2"></i>
                进入聊天
              </a-button>
            </router-link>
          </div>
        </a-card>

        <a-card :hoverable="true" class="feature-card" title="圈子">
          <template #extra>
            <i class="fas fa-map-marker-alt text-green-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">分享动态，了解同事近况</p>
            <router-link to="/rooms">
              <a-button type="primary">
                <i class="fas fa-arrow-right mr-2"></i>
                进入圈子
              </a-button>
            </router-link>
          </div>
        </a-card>

        <a-card :hoverable="true" class="feature-card" title="个人资料">
          <template #extra>
            <i class="fas fa-user text-orange-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">编辑个人信息、工作经历、联系方式</p>
            <router-link to="/profile">
              <a-button type="primary">
                <i class="fas fa-arrow-right mr-2"></i>
                编辑资料
              </a-button>
            </router-link>
          </div>
        </a-card>

        <a-card :hoverable="true" class="feature-card" title="系统公告">
          <template #extra>
            <i class="fas fa-bell text-red-500"></i>
          </template>
          <div class="card-body">
            <p class="feature-desc text-gray-600 text-sm mb-6">查看最新的系统通知和公告</p>
            <div class="announcement-preview flex items-center gap-2 p-3 bg-amber-50 rounded border-l-4 border-amber-500">
              <span class="announcement-dot w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-gray-700">欢迎使用 IMS 系统</span>
            </div>
          </div>
        </a-card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useUserStore } from '../stores/user'
import { userApi, chatApi } from '../api'
import type { DashboardStats } from '../types'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)
const userName = computed(() => userStore.userName || '用户')

const stats = ref<DashboardStats>({
  totalUsers: 0,
  onlineUsers: 0,
  adminUsers: 0,
  activeUsers: 0,
  totalPosts: 0,
  totalRooms: 0,
  totalMessages: 0
})

const userStats = ref({
  unreadCount: 0,
  chatCount: 0,
  registerDate: '',
  lastLogin: ''
})

const loading = ref(false)

const loadDashboardData = async () => {
  loading.value = true
  try {
    if (isAdmin.value) {
      const dashboardStats = await userApi.getDashboardStats()
      stats.value = dashboardStats
    } else {
      const unreadData = await chatApi.getGlobalUnread()
      userStats.value.unreadCount = unreadData.unreadCount
      
      const chatList = await chatApi.getChatList()
      userStats.value.chatCount = chatList.total
      
      if (userStore.user) {
        userStats.value.registerDate = userStore.user.createdAt ? 
          new Date(userStore.user.createdAt).toLocaleDateString('zh-CN') : ''
        userStats.value.lastLogin = userStore.user.lastLoginAt || userStore.user.lastLogin || ''
      }
    }
  } catch (error) {
    console.error('Load dashboard data error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-page {
  width: 100%;
}

/* 统计卡片网格布局 */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 功能卡片网格布局 */
.dashboard-row {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .dashboard-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card :deep(.ant-card-body) {
  padding: 1.5rem;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.online {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.admins {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
  margin: 0;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #0284c7;
}

.feature-card :deep(.ant-card-body) {
  padding: 0;
}

.card-body {
  padding: 1.5rem;
}

.feature-desc {
  color: #718096;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.announcement-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f59e0b;
}
</style>
