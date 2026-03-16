<template>
  <div class="dashboard-page">
    <!-- 顶部欢迎区域 -->
    <div class="welcome-section mb-3">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            <span class="greeting">{{ greeting }}，</span>
            <span class="username">{{ userName }}</span>
          </h1>
          <p class="welcome-subtitle">{{ welcomeMessage }}</p>
        </div>
        <div class="welcome-date">
          <div class="date-card">
            <span class="date-day">{{ currentDay }}</span>
            <span class="date-month">{{ currentMonth }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 管理员仪表盘 -->
    <template v-if="isAdmin">
      <!-- 统计卡片区域 - 玻璃拟态风格 -->
      <div class="stats-grid mb-3">
        <div v-for="(stat, index) in adminStats" :key="index" class="stat-card-glass" :class="stat.type">
          <div class="stat-glass-content">
            <div class="stat-glass-icon">
              <i :class="stat.icon"></i>
            </div>
            <div class="stat-glass-info">
              <h3 class="stat-glass-number">{{ stat.value }}</h3>
              <p class="stat-glass-label">{{ stat.label }}</p>
            </div>
          </div>
          <div class="stat-glass-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <i :class="stat.trend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
            <span>{{ Math.abs(stat.trend) }}%</span>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="dashboard-main-grid mb-3">
        <!-- 左侧：用户活动趋势图 -->
        <div class="dashboard-card chart-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-chart-line text-blue-500"></i>
              <span>用户活动趋势</span>
            </div>
            <div class="card-actions">
              <a-select v-model:value="chartPeriod" size="small" style="width: 100px">
                <a-select-option value="week">本周</a-select-option>
                <a-select-option value="month">本月</a-select-option>
                <a-select-option value="year">本年</a-select-option>
              </a-select>
            </div>
          </div>
          <div class="chart-container">
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div v-for="(bar, i) in chartData" :key="i" class="chart-bar-wrapper">
                  <div class="chart-bar" :style="{ height: bar + '%' }"></div>
                  <span class="chart-label">{{ ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：系统状态 -->
        <div class="dashboard-card status-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-server text-green-500"></i>
              <span>系统状态</span>
            </div>
            <span class="status-badge online">运行中</span>
          </div>
          <div class="status-list">
            <div v-for="(service, index) in systemServices" :key="index" class="status-item">
              <div class="status-info">
                <i :class="service.icon" :style="{ color: service.color }"></i>
                <span class="status-name">{{ service.name }}</span>
              </div>
              <div class="status-indicator">
                <span class="status-dot" :class="service.status"></span>
                <span class="status-text">{{ service.statusText }}</span>
              </div>
            </div>
          </div>
          <div class="system-metrics mt-4">
            <div class="metric">
              <span class="metric-value">{{ systemMetrics.cpu }}%</span>
              <span class="metric-label">CPU</span>
              <div class="metric-bar">
                <div class="metric-fill" :style="{ width: systemMetrics.cpu + '%', background: getMetricColor(systemMetrics.cpu) }"></div>
              </div>
            </div>
            <div class="metric">
              <span class="metric-value">{{ systemMetrics.memory }}%</span>
              <span class="metric-label">内存</span>
              <div class="metric-bar">
                <div class="metric-fill" :style="{ width: systemMetrics.memory + '%', background: getMetricColor(systemMetrics.memory) }"></div>
              </div>
            </div>
            <div class="metric">
              <span class="metric-value">{{ systemMetrics.storage }}%</span>
              <span class="metric-label">存储</span>
              <div class="metric-bar">
                <div class="metric-fill" :style="{ width: systemMetrics.storage + '%', background: getMetricColor(systemMetrics.storage) }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作和最近活动 -->
      <div class="dashboard-bottom-grid mb-3">
        <!-- 快捷操作 -->
        <div class="dashboard-card actions-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-bolt text-yellow-500"></i>
              <span>快捷操作</span>
            </div>
          </div>
          <div class="quick-actions">
            <router-link v-for="(action, index) in quickActions" :key="index" :to="action.path" class="quick-action-item">
              <div class="action-icon" :class="action.type">
                <i :class="action.icon"></i>
              </div>
              <span class="action-name">{{ action.name }}</span>
              <i class="fas fa-chevron-right action-arrow"></i>
            </router-link>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="dashboard-card activity-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-history text-purple-500"></i>
              <span>最近活动</span>
            </div>
            <a-button type="link" size="small">查看全部</a-button>
          </div>
          <div class="activity-list">
            <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
              <div class="activity-avatar" :class="activity.type">
                <i :class="activity.icon"></i>
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.text }}</p>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息通知 -->
        <div class="dashboard-card notifications-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-bell text-red-500"></i>
              <span>消息通知</span>
            </div>
            <a-badge :count="unreadNotifications" :overflow-count="99" />
          </div>
          <div class="notification-list">
            <div v-for="(notification, index) in notifications" :key="index" class="notification-item" :class="{ unread: !notification.read }">
              <div class="notification-dot"></div>
              <div class="notification-content">
                <p class="notification-title">{{ notification.title }}</p>
                <span class="notification-desc">{{ notification.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 普通用户仪表盘 -->
    <template v-else>
      <!-- 用户统计卡片 -->
      <div class="stats-grid user-stats-grid mb-3">
        <div v-for="(stat, index) in userStatsCards" :key="index" class="stat-card-glass" :class="stat.type">
          <div class="stat-glass-content">
            <div class="stat-glass-icon">
              <i :class="stat.icon"></i>
            </div>
            <div class="stat-glass-info">
              <h3 class="stat-glass-number">{{ stat.value }}</h3>
              <p class="stat-glass-label">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户主内容区 -->
      <div class="user-dashboard-grid">
        <!-- 快捷入口 -->
        <div class="dashboard-card shortcuts-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-rocket text-blue-500"></i>
              <span>快捷入口</span>
            </div>
          </div>
          <div class="shortcuts-grid">
            <router-link v-for="(shortcut, index) in userShortcuts" :key="index" :to="shortcut.path" class="shortcut-item">
              <div class="shortcut-icon" :class="shortcut.color">
                <i :class="shortcut.icon"></i>
              </div>
              <span class="shortcut-name">{{ shortcut.name }}</span>
            </router-link>
          </div>
        </div>

        <!-- 我的消息 -->
        <div class="dashboard-card messages-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-envelope text-green-500"></i>
              <span>我的消息</span>
            </div>
            <router-link to="/chat">
              <a-button type="link" size="small">查看全部</a-button>
            </router-link>
          </div>
          <div class="message-list">
            <div v-for="(msg, index) in recentMessages" :key="index" class="message-item">
              <div class="message-avatar">{{ getInitials(msg.sender) }}</div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ msg.sender }}</span>
                  <span class="message-time">{{ msg.time }}</span>
                </div>
                <p class="message-preview">{{ msg.preview }}</p>
              </div>
              <a-badge v-if="msg.unread" :count="msg.unread" />
            </div>
          </div>
        </div>

        <!-- 系统公告 -->
        <div class="dashboard-card announcements-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fas fa-bullhorn text-orange-500"></i>
              <span>系统公告</span>
            </div>
          </div>
          <div class="announcement-list">
            <div v-for="(announcement, index) in announcements" :key="index" class="announcement-item">
              <div class="announcement-tag" :class="announcement.type">{{ announcement.tag }}</div>
              <p class="announcement-title">{{ announcement.title }}</p>
              <span class="announcement-date">{{ announcement.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'
import { userApi, chatApi } from '../api'
// import type { DashboardStats } from '../types'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)
const userName = computed(() => userStore.userName || '用户')

// 问候语
const currentHour = new Date().getHours()
const greeting = computed(() => {
  if (currentHour < 6) return '夜深了'
  if (currentHour < 11) return '早上好'
  if (currentHour < 14) return '中午好'
  if (currentHour < 18) return '下午好'
  return '晚上好'
})

const welcomeMessage = computed(() => {
  if (isAdmin.value) {
    return '欢迎回到信息管理系统，今日系统运行正常，请查看各项统计数据。'
  }
  return '欢迎使用信息管理系统，开始与同事交流吧！'
})

// 当前日期
const now = ref(new Date())
const currentDay = computed(() => now.value.getDate())
const currentMonth = computed(() => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return months[now.value.getMonth()]
})

// 管理员统计数据
const adminStats = ref([
  { type: 'users', icon: 'fas fa-users', label: '总用户数', value: 0, trend: 12.5 },
  { type: 'online', icon: 'fas fa-plug', label: '当前在线', value: 0, trend: 5.3 },
  { type: 'admins', icon: 'fas fa-user-shield', label: '管理员', value: 0, trend: 0 },
  { type: 'active', icon: 'fas fa-check-circle', label: '活跃用户', value: 0, trend: 8.7 }
])

// 用户统计数据
const userStatsCards = ref([
  { type: 'messages', icon: 'fas fa-envelope', label: '未读消息', value: 0 },
  { type: 'chats', icon: 'fas fa-comments', label: '我的对话', value: 0 },
  { type: 'contacts', icon: 'fas fa-address-book', label: '联系人', value: 0 },
  { type: 'days', icon: 'fas fa-calendar-alt', label: '加入天数', value: 0 }
])

// 图表数据
const chartPeriod = ref('week')
const chartData = ref([45, 62, 38, 75, 52, 68, 85])

// 系统服务状态
const systemServices = ref([
  { name: 'API 服务', icon: 'fas fa-plug', color: '#52c41a', status: 'online', statusText: '正常' },
  { name: '数据库', icon: 'fas fa-database', color: '#52c41a', status: 'online', statusText: '正常' },
  { name: '消息队列', icon: 'fas fa-stream', color: '#52c41a', status: 'online', statusText: '正常' },
  { name: '文件存储', icon: 'fas fa-cloud', color: '#faad14', status: 'warning', statusText: '繁忙' }
])

// 系统指标
const systemMetrics = ref({ cpu: 32, memory: 58, storage: 72 })

// 快捷操作
const quickActions = ref([
  { name: '用户管理', icon: 'fas fa-users-cog', path: '/users', type: 'blue' },
  { name: '系统设置', icon: 'fas fa-cog', path: '/settings', type: 'green' },
  { name: '聊天记录', icon: 'fas fa-comments', path: '/chat', type: 'purple' },
  { name: '圈子管理', icon: 'fas fa-map-marker-alt', path: '/rooms', type: 'orange' }
])

// 最近活动
const recentActivities = ref([
  { type: 'user', icon: 'fas fa-user-plus', text: '新用户 张三 注册成功', time: '5分钟前' },
  { type: 'login', icon: 'fas fa-sign-in-alt', text: '管理员登录系统', time: '15分钟前' },
  { type: 'settings', icon: 'fas fa-cog', text: '系统设置已更新', time: '1小时前' },
  { type: 'message', icon: 'fas fa-comment', text: '收到新的反馈消息', time: '2小时前' }
])

// 通知
const unreadNotifications = ref(3)
const notifications = ref([
  { title: '系统更新通知', desc: '系统将于今晚2点进行维护更新', read: false },
  { title: '安全提醒', desc: '检测到异地登录，请确认是否为本人操作', read: false },
  { title: '新功能上线', desc: '圈子功能已正式上线，欢迎使用', read: true }
])

// 用户快捷入口
const userShortcuts = ref([
  { name: '消息中心', icon: 'fas fa-comments', path: '/chat', color: 'blue' },
  { name: '我的圈子', icon: 'fas fa-map-marker-alt', path: '/rooms', color: 'green' },
  { name: '个人资料', icon: 'fas fa-user', path: '/profile', color: 'orange' },
  { name: '联系人', icon: 'fas fa-address-book', path: '/contacts', color: 'purple' }
])

// 最近消息
const recentMessages = ref([
  { sender: '张三', preview: '下午好！关于项目的事情...', time: '10:30', unread: 2 },
  { sender: '李四', preview: '收到了，谢谢！', time: '昨天', unread: 0 },
  { sender: '王五', preview: '周末有空一起吃饭吗？', time: '昨天', unread: 1 }
])

// 公告
const announcements = ref([
  { title: '系统功能更新公告', date: '2024-03-15', tag: '更新', type: 'update' },
  { title: '关于系统维护的通知', date: '2024-03-10', tag: '维护', type: 'maintenance' },
  { title: '新功能使用指南', date: '2024-03-05', tag: '公告', type: 'notice' }
])

// 获取指标颜色
const getMetricColor = (value: number) => {
  if (value < 50) return '#52c41a'
  if (value < 80) return '#faad14'
  return '#f5222d'
}

// 获取姓名首字母
const getInitials = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 加载数据
const loadDashboardData = async () => {
  try {
    if (isAdmin.value) {
      const dashboardStats = await userApi.getDashboardStats()
      adminStats.value[0].value = dashboardStats.totalUsers
      adminStats.value[1].value = dashboardStats.onlineUsers
      adminStats.value[2].value = dashboardStats.adminUsers
      adminStats.value[3].value = dashboardStats.activeUsers
    } else {
      const unreadData = await chatApi.getGlobalUnread()
      userStatsCards.value[0].value = unreadData.unreadCount
      
      const chatList = await chatApi.getChatList()
      userStatsCards.value[1].value = chatList.total
      
      if (userStore.user) {
        const joinDate = new Date(userStore.user.createdAt || '')
        const days = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
        userStatsCards.value[3].value = days
      }
    }
  } catch (error) {
    console.error('Load dashboard data error:', error)
  }
}

// 定时器
let timer: number | null = null

onMounted(() => {
  loadDashboardData()
  // 每分钟更新一次日期
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.dashboard-page {
  width: 100%;
  min-height: 100%;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px 32px;
  color: white;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  border-radius: 16px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.greeting {
  opacity: 0.9;
}

.username {
  font-weight: 700;
}

.welcome-subtitle {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}

.date-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 12px 20px;
  text-align: center;
  min-width: 80px;
}

.date-day {
  display: block;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.date-month {
  display: block;
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

/* 玻璃拟态统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card-glass {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
}

.stat-card-glass:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-glass-content {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.stat-glass-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-card-glass.users .stat-glass-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-glass.online .stat-glass-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-card-glass.admins .stat-glass-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-glass.active .stat-glass-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card-glass.messages .stat-glass-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-card-glass.chats .stat-glass-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.stat-card-glass.contacts .stat-glass-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.stat-card-glass.days .stat-glass-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.stat-glass-number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.stat-glass-label {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.stat-glass-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 16px;
  width: fit-content;
}

.stat-glass-trend.up {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.stat-glass-trend.down {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 通用卡片样式 */
.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

/* 主内容网格 */
.dashboard-main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 12px !important;
}

@media (min-width: 1024px) {
  .dashboard-main-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* 图表区域 */
.chart-container {
  height: 240px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding-bottom: 24px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  gap: 12px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.chart-bar {
  width: 100%;
  max-width: 48px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  transition: all 0.3s ease;
  opacity: 0.8;
}

.chart-bar:hover {
  opacity: 1;
  transform: scaleY(1.05);
}

.chart-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

/* 系统状态 */
.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-info i {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.status-name {
  font-size: 14px;
  color: #374151;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 16px;
}

.status-dot.online {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-dot.warning {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.status-dot.offline {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.status-text {
  font-size: 12px;
  color: #6b7280;
}

/* 系统指标 */
.system-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.metric {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  min-width: 40px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
  min-width: 40px;
}

.metric-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 底部网格 */
.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 12px !important;
}

@media (min-width: 1024px) {
  .dashboard-bottom-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-action-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.quick-action-item:hover {
  background: #f3f4f6;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 16px;
}

.action-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon.green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.action-icon.purple {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.action-icon.orange {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.action-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.action-arrow {
  font-size: 12px;
  color: #9ca3af;
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.activity-avatar.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.activity-avatar.login {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.activity-avatar.settings {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.activity-avatar.message {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #374151;
  margin: 0 0 4px 0;
}

.activity-time {
  font-size: 12px;
  color: #9ca3af;
}

/* 通知列表 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  transition: background 0.2s ease;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 16px;
  background: #3b82f6;
  margin-top: 6px;
  flex-shrink: 0;
}

.notification-item.unread .notification-dot {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.notification-desc {
  font-size: 12px;
  color: #6b7280;
}

/* 用户仪表盘网格 */
.user-stats-grid {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .user-stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.user-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 768px) {
  .user-dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .user-dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 快捷入口 */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 16px;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
  background: #f9fafb;
}

.shortcut-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.shortcut-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  margin-bottom: 8px;
}

.shortcut-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.shortcut-icon.green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.shortcut-icon.orange {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.shortcut-icon.purple {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.shortcut-name {
  font-size: 13px;
  color: #4b5563;
}

/* 消息列表 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  transition: background 0.2s ease;
}

.message-item:hover {
  background: #f9fafb;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-sender {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
}

.message-preview {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 公告列表 */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item {
  padding: 12px;
  border-radius: 16px;
  background: #f9fafb;
  transition: background 0.2s ease;
}

.announcement-item:hover {
  background: #f3f4f6;
}

.announcement-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.announcement-tag.update {
  background: #dbeafe;
  color: #1d4ed8;
}

.announcement-tag.maintenance {
  background: #fef3c7;
  color: #b45309;
}

.announcement-tag.notice {
  background: #e0e7ff;
  color: #4338ca;
}

.announcement-title {
  font-size: 14px;
  color: #1f2937;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.announcement-date {
  font-size: 12px;
  color: #9ca3af;
}
</style>
