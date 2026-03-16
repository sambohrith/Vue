<template>
  <div class="profile-page">
    <!-- 顶部封面 -->
    <div class="profile-cover">
      <div class="cover-gradient"></div>
      <div class="cover-pattern"></div>
    </div>

    <!-- 主体内容 -->
    <div class="profile-body">
      <!-- 左侧信息栏 -->
      <div class="profile-sidebar">
        <div class="profile-card user-info-card">
          <div class="avatar-wrapper">
            <div class="avatar-container">
              <img v-if="userProfile.avatar" :src="userProfile.avatar" class="user-avatar" alt="头像">
              <div v-else class="avatar-placeholder">
                {{ getInitials(userProfile.fullName || userProfile.username || '') }}
              </div>
              <div class="avatar-overlay" @click="uploadAvatar">
                <i class="fas fa-camera"></i>
                <span>更换头像</span>
              </div>
            </div>
            <div class="online-status" :class="{ online: true }"></div>
          </div>

          <h2 class="user-name">{{ userProfile.fullName || userProfile.username }}</h2>
          <p class="user-role">{{ userRole }}</p>

          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value">{{ userStats.joinDays }}</span>
              <span class="stat-label">加入天数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userStats.messageCount }}</span>
              <span class="stat-label">消息数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userStats.contactCount }}</span>
              <span class="stat-label">联系人</span>
            </div>
          </div>

          <div class="user-bio" v-if="userProfile.bio">
            <i class="fas fa-quote-left"></i>
            <p>{{ userProfile.bio }}</p>
          </div>

          <div class="contact-info">
            <div class="contact-item">
              <i class="fas fa-envelope"></i>
              <span>{{ userProfile.email }}</span>
            </div>
            <div class="contact-item" v-if="userProfile.phone">
              <i class="fas fa-phone"></i>
              <span>{{ userProfile.phone }}</span>
            </div>
            <div class="contact-item" v-if="userProfile.department">
              <i class="fas fa-building"></i>
              <span>{{ userProfile.department }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="profile-content">
        <a-tabs v-model:activeKey="activeTab" class="profile-tabs">
          <!-- 基本信息 -->
          <a-tab-pane key="basic" tab="基本信息">
            <div class="tab-content">
              <div class="section-header">
                <h3>个人信息</h3>
                <a-button type="primary" @click="saveProfile" :loading="loading">
                  <i class="fas fa-save mr-2"></i>
                  保存修改
                </a-button>
              </div>

              <a-form :model="userProfile" layout="vertical" class="profile-form">
                <a-row :gutter="24">
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="用户名">
                      <a-input v-model:value="userProfile.username" disabled size="large">
                        <template #prefix><i class="fas fa-user text-gray-400"></i></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="姓名">
                      <a-input v-model:value="userProfile.fullName" placeholder="请输入姓名" size="large">
                        <template #prefix><i class="fas fa-id-card text-gray-400"></i></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-row :gutter="24">
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="邮箱">
                      <a-input v-model:value="userProfile.email" disabled size="large">
                        <template #prefix><i class="fas fa-envelope text-gray-400"></i></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="手机号">
                      <a-input v-model:value="userProfile.phone" placeholder="请输入手机号" size="large">
                        <template #prefix><i class="fas fa-phone text-gray-400"></i></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-row :gutter="24">
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="部门">
                      <a-input v-model:value="userProfile.department" placeholder="请输入部门" size="large">
                        <template #prefix><i class="fas fa-building text-gray-400"></i></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                  <a-col :xs="24" :sm="12">
                    <a-form-item label="职位">
                      <a-input v-model:value="userProfile.position" placeholder="请输入职位" size="large">
                        <template #prefix><i class="fas fa-briefcase text-gray-400"></i></template>
                      </a-input>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-form-item label="个人简介">
                  <a-textarea
                    v-model:value="userProfile.bio"
                    :rows="4"
                    placeholder="介绍一下自己..."
                    show-count
                    :maxlength="200"
                    size="large"
                  />
                </a-form-item>
              </a-form>
            </div>
          </a-tab-pane>

          <!-- 安全设置 -->
          <a-tab-pane key="security" tab="安全设置">
            <div class="tab-content">
              <div class="security-section">
                <h3>修改密码</h3>
                <a-form :model="passwordForm" layout="vertical" class="password-form">
                  <a-form-item label="当前密码">
                    <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入当前密码" size="large">
                      <template #prefix><i class="fas fa-lock text-gray-400"></i></template>
                    </a-input-password>
                  </a-form-item>
                  <a-form-item label="新密码">
                    <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" size="large">
                      <template #prefix><i class="fas fa-key text-gray-400"></i></template>
                    </a-input-password>
                  </a-form-item>
                  <a-form-item label="确认新密码">
                    <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" size="large">
                      <template #prefix><i class="fas fa-check-circle text-gray-400"></i></template>
                    </a-input-password>
                  </a-form-item>
                  <a-form-item>
                    <a-button type="primary" @click="changePassword" :loading="passwordLoading">
                      修改密码
                    </a-button>
                  </a-form-item>
                </a-form>
              </div>

              <a-divider />

              <div class="security-section">
                <h3>账号安全</h3>
                <div class="security-items">
                  <div class="security-item">
                    <div class="item-info">
                      <i class="fas fa-shield-alt text-green-500"></i>
                      <div>
                        <h4>登录保护</h4>
                        <p>已开启账号保护，登录时需要验证</p>
                      </div>
                    </div>
                    <a-switch checked-children="开" un-checked-children="关" default-checked />
                  </div>
                  <div class="security-item">
                    <div class="item-info">
                      <i class="fas fa-bell text-blue-500"></i>
                      <div>
                        <h4>登录通知</h4>
                        <p>新设备登录时发送通知</p>
                      </div>
                    </div>
                    <a-switch checked-children="开" un-checked-children="关" default-checked />
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>

          <!-- 操作记录 -->
          <a-tab-pane key="logs" tab="操作记录">
            <div class="tab-content">
              <div class="logs-section">
                <h3>最近登录</h3>
                <a-timeline>
                  <a-timeline-item v-for="(log, index) in loginLogs" :key="index" :color="index === 0 ? 'green' : 'gray'">
                    <div class="log-item">
                      <div class="log-header">
                        <span class="log-time">{{ log.time }}</span>
                        <a-tag v-if="index === 0" color="success">当前</a-tag>
                      </div>
                      <p class="log-detail">
                        <i class="fas fa-desktop mr-2"></i>
                        {{ log.device }} · {{ log.location }}
                      </p>
                    </div>
                  </a-timeline-item>
                </a-timeline>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { userApi } from '../api'
import http from '../api/http'
import type { User } from '../types'
import { message } from 'ant-design-vue'

const userStore = useUserStore()
const loading = ref(false)
const passwordLoading = ref(false)
const activeTab = ref('basic')

const userRole = computed(() => userStore.user?.role === 'admin' ? '管理员' : '普通用户')

// 用户资料
const userProfile = ref<Partial<User>>({
  username: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  bio: '',
  avatar: ''
})

// 统计信息
const userStats = ref({
  joinDays: 0,
  messageCount: 0,
  contactCount: 0
})

// 密码表单
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 登录日志
const loginLogs = ref([
  { time: '2024-01-15 14:30:22', device: 'Chrome on Windows', location: '北京' },
  { time: '2024-01-14 09:15:08', device: 'Chrome on Windows', location: '北京' },
  { time: '2024-01-13 18:45:33', device: 'Safari on iPhone', location: '上海' },
  { time: '2024-01-12 11:20:15', device: 'Chrome on Mac', location: '深圳' }
])

// 获取姓名首字母
const getInitials = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 上传头像
const uploadAvatar = () => {
  message.info('头像上传功能开发中...')
}

// 加载用户信息
const loadUserProfile = async () => {
  try {
    const user = await userApi.getMyInfo()
    userProfile.value = {
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      position: user.position || '',
      bio: user.bio || '',
      avatar: user.avatar || ''
    }

    // 计算加入天数
    if (user.createdAt) {
      const joinDate = new Date(user.createdAt)
      const now = new Date()
      userStats.value.joinDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  } catch (error) {
    console.error('Load profile error:', error)
  }
}

// 保存资料
const saveProfile = async () => {
  loading.value = true
  try {
    const updatedUser = await userApi.updateMyInfo(userProfile.value)

    if (userStore.user) {
      userStore.user.fullName = updatedUser.fullName
      userStore.user.phone = updatedUser.phone
      userStore.user.department = updatedUser.department
      userStore.user.position = updatedUser.position
      userStore.user.bio = updatedUser.bio
    }

    message.success('保存成功')
  } catch (error) {
    console.error('Save profile error:', error)
    message.error('保存失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    message.warning('请填写完整密码信息')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    message.error('两次输入的新密码不一致')
    return
  }

  passwordLoading.value = true
  try {
    await http.post('/users/me/password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    message.success('密码修改成功')
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    message.error('密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.profile-page {
  width: 100%;
  min-height: 100%;
}

/* 封面区域 */
.profile-cover {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
}

.cover-pattern {
  display: none;
}

/* 主体布局 */
.profile-body {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: -60px auto 0;
  padding: 0 24px 24px;
  position: relative;
  z-index: 1;
}

/* 左侧边栏 */
.profile-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.profile-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.user-info-card {
  text-align: center;
}

/* 头像 */
.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  font-weight: 600;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay i {
  font-size: 24px;
  margin-bottom: 4px;
}

.avatar-overlay span {
  font-size: 12px;
}

.online-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid white;
}

/* 用户信息 */
.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}

.user-role {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
}

/* 统计 */
.user-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 10px;
  min-width: 70px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

/* 简介 */
.user-bio {
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  text-align: left;
  position: relative;
  border-left: 3px solid #667eea;
}

.user-bio i {
  color: #667eea;
  font-size: 16px;
  margin-bottom: 6px;
  display: block;
}

.user-bio p {
  color: #4b5563;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}

/* 联系方式 */
.contact-info {
  text-align: left;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  color: #4b5563;
  font-size: 13px;
  border-bottom: 1px solid #f3f4f6;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item i {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 右侧内容 */
.profile-content {
  flex: 1;
  min-width: 0;
}

.profile-tabs {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.profile-tabs :deep(.ant-tabs-nav) {
  padding: 0 20px;
  margin-bottom: 0;
  border-bottom: 1px solid #f3f4f6;
}

.profile-tabs :deep(.ant-tabs-tab) {
  padding: 14px 0;
  font-size: 14px;
}

.profile-tabs :deep(.ant-tabs-tab-active) {
  font-weight: 600;
}

.tab-content {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header h3::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

/* 表单样式 */
.profile-form :deep(.ant-form-item-label) {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.profile-form :deep(.ant-input),
.profile-form :deep(.ant-input-affix-wrapper) {
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  background: white;
  padding: 8px 12px;
}

.profile-form :deep(.ant-input:focus),
.profile-form :deep(.ant-input-affix-wrapper:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.profile-form :deep(.ant-input-affix-wrapper .ant-input) {
  border: none;
  box-shadow: none;
  padding: 0;
}

/* 密码表单样式 - 与基本信息保持一致 */
.password-form :deep(.ant-form-item-label) {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.password-form :deep(.ant-input-affix-wrapper) {
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  background: white;
  padding: 8px 12px;
}

.password-form :deep(.ant-input-affix-wrapper:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* 安全设置 */
.security-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.security-section h3::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.security-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.security-item:hover {
  background: #f0f4ff;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-info i {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px;
}

.item-info p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

/* 日志 */
.logs-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logs-section h3::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.log-item {
  padding: 6px 0;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.log-time {
  font-weight: 500;
  color: #1f2937;
  font-size: 13px;
}

.log-detail {
  color: #6b7280;
  font-size: 12px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .profile-body {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .profile-cover {
    height: 150px;
  }

  .profile-body {
    margin-top: -40px;
    padding: 0 16px 16px;
  }

  .profile-card {
    padding: 20px;
  }

  .avatar-container {
    width: 100px;
    height: 100px;
  }

  .user-name {
    font-size: 20px;
  }

  .tab-content {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
