<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <i class="fas fa-users-cog text-primary text-2xl"></i>
        <span v-if="!isSidebarCollapsed" class="ml-2 font-semibold">信息管理系统</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" :class="{ 'active': currentRoute === '/dashboard' }">
          <i class="fas fa-tachometer-alt"></i>
          <span v-if="!isSidebarCollapsed">仪表盘</span>
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ 'active': currentRoute === '/profile' }">
          <i class="fas fa-user-circle"></i>
          <span v-if="!isSidebarCollapsed">个人资料</span>
        </router-link>
        <router-link to="/contacts" class="nav-item" :class="{ 'active': currentRoute === '/contacts' }">
          <i class="fas fa-address-book"></i>
          <span v-if="!isSidebarCollapsed">联系人</span>
        </router-link>
        <router-link to="/chat" class="nav-item" :class="{ 'active': currentRoute === '/chat' }">
          <i class="fas fa-comments"></i>
          <span v-if="!isSidebarCollapsed">消息中心</span>
        </router-link>
        <router-link to="/posts" class="nav-item" :class="{ 'active': currentRoute === '/posts' }">
          <i class="fas fa-comment-dots"></i>
          <span v-if="!isSidebarCollapsed">说说</span>
        </router-link>
        <router-link to="/rooms" class="nav-item" :class="{ 'active': currentRoute === '/rooms' }">
          <i class="fas fa-globe"></i>
          <span v-if="!isSidebarCollapsed">圈子</span>
        </router-link>
        <router-link v-if="isAdmin" to="/users" class="nav-item" :class="{ 'active': currentRoute === '/users' }">
          <i class="fas fa-users"></i>
          <span v-if="!isSidebarCollapsed">用户管理</span>
        </router-link>
        <router-link v-if="isAdmin" to="/settings" class="nav-item" :class="{ 'active': currentRoute === '/settings' }">
          <i class="fas fa-cog"></i>
          <span v-if="!isSidebarCollapsed">系统设置</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div v-if="!isSidebarCollapsed" class="user-details">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
        </div>
        <button v-if="!isSidebarCollapsed" id="logout-btn" class="btn btn-logout" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          退出登录
        </button>
        <button v-else id="logout-btn" class="btn btn-logout" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部导航 -->
      <header class="top-header">
        <div class="header-left">
          <button id="sidebar-toggle" class="btn btn-icon" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
          </button>
          <div class="page-title-header">
            <h2 class="page-title">{{ pageTitle }}</h2>
            <span class="page-subtitle">{{ pageSubtitle }}</span>
          </div>
        </div>
        <div class="header-right">
          <button class="btn btn-icon">
            <i class="fas fa-bell"></i>
            <span class="badge">3</span>
          </button>
          <button class="btn btn-icon" @click="toggleDarkMode">
            <i v-if="!isDarkMode" class="fas fa-moon"></i>
            <i v-else class="fas fa-sun"></i>
          </button>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="content-wrapper">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isSidebarCollapsed = ref(false)
const currentRoute = computed(() => route.path)
const isAdmin = computed(() => userStore.isAdmin)
const userName = computed(() => userStore.userName || '用户')
const userRole = computed(() => userStore.user?.role === 'admin' ? '管理员' : '普通用户')
const isDarkMode = computed(() => document.documentElement.classList.contains('dark'))

// 页面标题映射
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: '仪表盘', subtitle: '系统概览和统计数据' },
  '/profile': { title: '个人资料', subtitle: '管理您的个人信息' },
  '/contacts': { title: '联系人', subtitle: '查看和管理联系人' },
  '/chat': { title: '消息中心', subtitle: '实时沟通和交流' },
  '/posts': { title: '说说', subtitle: '分享生活点滴' },
  '/rooms': { title: '圈子', subtitle: '加入感兴趣的群组' },
  '/users': { title: '用户管理', subtitle: '管理系统用户账号、权限和状态' },
  '/settings': { title: '系统设置', subtitle: '配置系统参数和选项' }
}

const pageTitle = computed(() => pageTitles[currentRoute.value]?.title || '信息管理系统')
const pageSubtitle = computed(() => pageTitles[currentRoute.value]?.subtitle || '')

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const logout = () => {
  userStore.logout()
  router.push('/login')
}

const toggleDarkMode = () => {
  const isDark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('darkMode', isDark.toString())
}

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode === 'true') {
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background-color: white;
  border-right: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  height: 68px;
  padding: 0 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  flex-shrink: 0;
}

.sidebar-header i {
  color: white;
  font-size: 1.5rem;
}

.sidebar.collapsed .sidebar-header {
  padding: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1.25rem;
  color: #4b5563;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin: 0 0.5rem;
  border-radius: 0.375rem;
  position: relative;
}

.nav-item:hover {
  background-color: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
}

.nav-item.active {
  background-color: #eff6ff;
  color: #2563eb;
  border-left-color: #3b82f6;
  font-weight: 500;
}

.nav-item i {
  width: 20px;
  margin-right: 0.75rem;
  font-size: 1.1rem;
}

.sidebar-footer {
  padding: 1.25rem 1rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.user-role {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.125rem;
}

.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  color: #ef4444;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.btn-logout:hover {
  background-color: #fee2e2;
  border-color: #fecaca;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.15);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f1f5f9;
}

.top-header {
  height: 68px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 50;
}

.btn-icon {
  background: none;
  border: none;
  padding: 0.625rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.btn-icon:hover {
  background-color: #f8fafc;
  color: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
}

.page-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.2;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-search {
  position: relative;
  flex: 1;
  max-width: 320px;
  margin: 0 1.5rem;
}

.header-search input {
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  width: 100%;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background-color: #f8fafc;
}

.header-search input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: white;
}

.header-search i {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.875rem;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
}

.content-wrapper {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: #f1f5f9;
}

/* 滚动条样式 */
.content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.content-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 暗黑模式 */
.dark .sidebar {
  background-color: #1e293b;
  border-right-color: #334155;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.dark .sidebar-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  border-bottom-color: #334155;
  color: #f8fafc;
}

.dark .nav-item {
  color: #94a3b8;
}

.dark .nav-item:hover {
  background-color: #334155;
  color: #f8fafc;
  transform: translateX(4px);
}

.dark .nav-item.active {
  background-color: #1e3a8a;
  color: #bfdbfe;
  border-left-color: #3b82f6;
  font-weight: 500;
}

.dark .sidebar-footer {
  background-color: #2d3748;
  border-top-color: #334155;
}

.dark .user-info {
  background-color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .user-avatar {
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);
}

.dark .user-name {
  color: #f8fafc;
}

.dark .user-role {
  color: #94a3b8;
}

.dark .btn-logout {
  background-color: #1e293b;
  border-color: #334155;
  color: #fca5a5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .btn-logout:hover {
  background-color: #7f1d1d;
  border-color: #991b1b;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.dark .main-content {
  background-color: #0f172a;
}

.dark .top-header {
  background-color: #1e293b;
  border-bottom-color: #334155;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dark .btn-icon {
  color: #94a3b8;
}

.dark .btn-icon:hover {
  background-color: #334155;
  color: #f8fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dark .page-title {
  color: #f8fafc;
}

.dark .page-subtitle {
  color: #94a3b8;
}

.dark .header-search input {
  background-color: #334155;
  border-color: #475569;
  color: #f8fafc;
}

.dark .header-search input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  background-color: #1e293b;
}

.dark .header-search i {
  color: #64748b;
}

.dark .content-wrapper {
  background-color: #0f172a;
}

/* 暗黑模式滚动条 */
.dark .content-wrapper::-webkit-scrollbar-track {
  background: #0f172a;
}

.dark .content-wrapper::-webkit-scrollbar-thumb {
  background: #334155;
}

.dark .content-wrapper::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>