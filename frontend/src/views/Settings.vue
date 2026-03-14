<template>
  <MainLayout>
    <div class="settings-page">
      <!-- 保存按钮 -->
      <div class="header-actions">
        <a-button type="primary" size="large" @click="saveSettings" :loading="loading" id="save-settings-btn">
          <i class="fas fa-save mr-2"></i>
          {{ loading ? '保存中...' : '保存设置' }}
        </a-button>
      </div>

      <!-- 设置卡片网格 -->
      <div class="settings-grid">
        <!-- 基本设置 -->
        <a-card class="settings-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <div class="title-icon bg-blue-500">
                <i class="fas fa-globe text-white"></i>
              </div>
              <div class="title-text">
                <div class="title-main">基本设置</div>
                <div class="title-desc">系统名称、Logo 和描述信息</div>
              </div>
            </div>
          </template>
          <a-form :model="settings" layout="vertical" class="settings-form">
            <a-form-item label="系统名称">
              <a-input v-model:value="settings.siteName" placeholder="请输入系统名称" size="large">
                <template #prefix>
                  <i class="fas fa-heading text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
            <a-form-item label="Logo URL">
              <a-input v-model:value="settings.siteLogo" placeholder="请输入Logo地址" size="large">
                <template #prefix>
                  <i class="fas fa-image text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
            <a-form-item label="系统描述">
              <a-textarea
                v-model:value="settings.siteDescription"
                :rows="4"
                placeholder="请输入系统描述"
                show-count
                :maxlength="200"
              />
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 安全设置 -->
        <a-card class="settings-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <div class="title-icon bg-green-500">
                <i class="fas fa-shield-alt text-white"></i>
              </div>
              <div class="title-text">
                <div class="title-main">安全设置</div>
                <div class="title-desc">密码策略和访问控制</div>
              </div>
            </div>
          </template>
          <a-form :model="settings" layout="vertical" class="settings-form">
            <a-form-item>
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">密码最小长度</div>
                  <div class="setting-desc">用户密码必须达到的最小字符数</div>
                </div>
                <a-input-number v-model:value="settings.passwordMinLength" :min="4" :max="20" size="large" />
              </div>
            </a-form-item>
            <a-form-item>
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">登录失败次数限制</div>
                  <div class="setting-desc">超过此次数将暂时锁定账号</div>
                </div>
                <a-input-number v-model:value="settings.loginAttempts" :min="1" :max="20" size="large" />
              </div>
            </a-form-item>
            <a-divider />
            <a-form-item>
              <div class="switch-item">
                <div class="switch-info">
                  <div class="switch-label">
                    <i class="fas fa-mobile-alt text-blue-500 mr-2"></i>
                    启用两步验证
                  </div>
                  <div class="switch-desc">登录时需要额外的验证码</div>
                </div>
                <a-switch v-model:checked="settings.enable2FA" size="large" />
              </div>
            </a-form-item>
            <a-form-item>
              <div class="switch-item">
                <div class="switch-info">
                  <div class="switch-label">
                    <i class="fas fa-network-wired text-green-500 mr-2"></i>
                    启用IP限制
                  </div>
                  <div class="switch-desc">只允许特定IP地址访问系统</div>
                </div>
                <a-switch v-model:checked="settings.enableIPRestriction" size="large" />
              </div>
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 通知设置 -->
        <a-card class="settings-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <div class="title-icon bg-orange-500">
                <i class="fas fa-bell text-white"></i>
              </div>
              <div class="title-text">
                <div class="title-main">通知设置</div>
                <div class="title-desc">邮件和系统通知配置</div>
              </div>
            </div>
          </template>
          <a-form :model="settings" layout="vertical" class="settings-form">
            <a-form-item>
              <div class="switch-item">
                <div class="switch-info">
                  <div class="switch-label">
                    <i class="fas fa-envelope text-orange-500 mr-2"></i>
                    启用邮件通知
                  </div>
                  <div class="switch-desc">发送重要事件的邮件通知</div>
                </div>
                <a-switch v-model:checked="settings.enableEmailNotifications" size="large" />
              </div>
            </a-form-item>
            <a-form-item>
              <div class="switch-item">
                <div class="switch-info">
                  <div class="switch-label">
                    <i class="fas fa-comment-alt text-purple-500 mr-2"></i>
                    启用系统通知
                  </div>
                  <div class="switch-desc">在系统内显示通知消息</div>
                </div>
                <a-switch v-model:checked="settings.enableSystemNotifications" size="large" />
              </div>
            </a-form-item>
            <a-divider />
            <a-form-item label="通知邮箱">
              <a-input 
                v-model:value="settings.notificationEmail" 
                placeholder="请输入通知邮箱" 
                type="email"
                size="large"
              >
                <template #prefix>
                  <i class="fas fa-at text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
          </a-form>
        </a-card>

        <!-- 数据备份 -->
        <a-card class="settings-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <div class="title-icon bg-purple-500">
                <i class="fas fa-database text-white"></i>
              </div>
              <div class="title-text">
                <div class="title-main">数据备份</div>
                <div class="title-desc">自动备份和手动备份管理</div>
              </div>
            </div>
          </template>
          <a-form :model="settings" layout="vertical" class="settings-form">
            <a-form-item label="备份频率">
              <a-select v-model:value="settings.backupFrequency" placeholder="请选择备份频率" size="large">
                <a-select-option value="daily">
                  <i class="fas fa-calendar-day mr-2 text-blue-500"></i>每天
                </a-select-option>
                <a-select-option value="weekly">
                  <i class="fas fa-calendar-week mr-2 text-green-500"></i>每周
                </a-select-option>
                <a-select-option value="monthly">
                  <i class="fas fa-calendar-alt mr-2 text-orange-500"></i>每月
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">备份保留时间</div>
                  <div class="setting-desc">超过此时间的备份将被自动删除</div>
                </div>
                <div class="setting-input">
                  <a-input-number v-model:value="settings.backupRetention" :min="1" :max="365" size="large" />
                  <span class="unit">天</span>
                </div>
              </div>
            </a-form-item>
            <a-divider />
            <a-form-item>
              <div class="backup-actions">
                <a-button size="large" @click="backupNow" :loading="loading">
                  <i class="fas fa-sync mr-2"></i>
                  立即备份
                </a-button>
                <a-button size="large" type="primary" ghost @click="downloadBackup">
                  <i class="fas fa-download mr-2"></i>
                  下载最新备份
                </a-button>
              </div>
            </a-form-item>
          </a-form>
        </a-card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { settingsApi } from '../api'
import type { Settings } from '../api/settings'
import { message } from 'ant-design-vue'

const loading = ref(false)

const settings = ref<Settings>({
  siteName: '',
  siteLogo: '',
  siteDescription: '',
  passwordMinLength: 6,
  loginAttempts: 5,
  enable2FA: false,
  enableIPRestriction: false,
  enableEmailNotifications: true,
  enableSystemNotifications: true,
  notificationEmail: '',
  backupFrequency: 'daily',
  backupRetention: 30
})

const loadSettings = async () => {
  try {
    const data = await settingsApi.getSettings()
    settings.value = data
  } catch (error) {
    console.error('Load settings error:', error)
  }
}

const saveSettings = async () => {
  loading.value = true
  try {
    await settingsApi.updateSettings(settings.value)
    message.success('设置保存成功')
  } catch (error: any) {
    console.error('Save settings error:', error)
    message.error(error.message || '保存失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const backupNow = async () => {
  loading.value = true
  try {
    await settingsApi.createBackup()
    message.success('备份成功')
  } catch (error: any) {
    console.error('Backup error:', error)
    message.error(error.message || '备份失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const downloadBackup = async () => {
  try {
    const url = await settingsApi.downloadBackup()
    window.open(url, '_blank')
  } catch (error: any) {
    console.error('Download backup error:', error)
    message.error(error.message || '下载备份失败，请稍后重试')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 64px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

/* 设置网格 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* 设置卡片 */
.settings-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.settings-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.settings-card :deep(.ant-card-head) {
  border-bottom: none;
  padding: 24px 24px 0;
}

.settings-card :deep(.ant-card-body) {
  padding: 24px;
}

/* 卡片标题 */
.card-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-main {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.title-desc {
  font-size: 13px;
  color: #6b7280;
}

/* 表单样式 */
.settings-form :deep(.ant-form-item-label) {
  font-weight: 500;
  color: #374151;
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 13px;
  color: #6b7280;
}

.setting-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit {
  color: #6b7280;
  font-size: 14px;
}

/* 开关项 */
.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
  transition: background 0.2s;
}

.switch-item:hover {
  background: #f3f4f6;
}

.switch-info {
  flex: 1;
}

.switch-label {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.switch-desc {
  font-size: 13px;
  color: #6b7280;
}

/* 备份操作 */
.backup-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 分隔线 */
:deep(.ant-divider) {
  margin: 16px 0;
}
</style>
