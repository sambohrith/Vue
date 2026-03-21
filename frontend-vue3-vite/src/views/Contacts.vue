<template>
  <div class="contacts-page">
    <div class="page-header-section">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">
            <i class="fas fa-users"></i>
            <span>联系人</span>
          </h1>
          <p class="page-subtitle">共 {{ contacts.length }} 位联系人</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索联系人..."
              class="search-input"
            />
          </div>
          <a-button
            class="refresh-btn"
            @click="refreshContacts"
            title="刷新列表"
          >
            <i class="fas fa-sync" :class="{ 'animate-spin': loading }"></i>
          </a-button>
        </div>
      </div>
    </div>

    <div class="contacts-container">
      <a-spin :spinning="loading">
        <a-empty v-if="!loading && contacts.length === 0" description="暂无联系人" />
        <div v-else class="contacts-grid">
          <div class="contact-card" v-for="contact in filteredContacts" :key="contact.id">
            <div class="contact-avatar-wrapper">
              <div class="contact-avatar">
                {{ getInitials(contact.name) }}
              </div>
              <span v-if="contact.role === 'admin'" class="role-badge admin">
                <i class="fas fa-crown"></i>
              </span>
            </div>
            <div class="contact-details">
              <h4 class="contact-name">{{ contact.name }}</h4>
              <p class="contact-email">{{ contact.email }}</p>
              <div class="contact-meta">
                <span v-if="contact.department" class="meta-tag department">
                  <i class="fas fa-building"></i>
                  {{ contact.department }}
                </span>
                <span v-if="contact.position" class="meta-tag position">
                  <i class="fas fa-briefcase"></i>
                  {{ contact.position }}
                </span>
              </div>
            </div>
            <div class="contact-actions">
              <a-button
                class="action-btn chat-btn"
                @click="startChat(contact.id, contact.name)"
                title="发送消息"
              >
                <i class="fas fa-comment"></i>
              </a-button>
              <a-button
                class="action-btn profile-btn"
                @click="viewProfile(contact.id)"
                title="查看资料"
              >
                <i class="fas fa-user"></i>
              </a-button>
            </div>
          </div>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '../api'
import type { User } from '../types'

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')

const contacts = ref<User[]>([])

const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value
  const query = searchQuery.value.toLowerCase()
  return contacts.value.filter(contact => 
    contact.name.toLowerCase().includes(query) ||
    contact.email.toLowerCase().includes(query)
  )
})

const getInitials = (name: string) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

const refreshContacts = async () => {
  loading.value = true
  try {
    const response = await userApi.getContacts()
    contacts.value = response.contacts || []
  } catch (error) {
    console.error('Refresh contacts error:', error)
    contacts.value = []
  } finally {
    loading.value = false
  }
}

const startChat = (userId: number, name: string) => {
  router.push(`/chat?userId=${userId}&userName=${name}`)
}

const viewProfile = (userId: number) => {
  console.log('View profile:', userId)
}

onMounted(() => {
  refreshContacts()
})
</script>

<style scoped>
.contacts-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #9ca3af;
  font-size: 14px;
}

.search-input {
  width: 280px;
  padding: 10px 14px 10px 40px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.refresh-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.refresh-btn i {
  font-size: 14px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.contacts-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .contacts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .contacts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .contacts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.contact-card:hover {
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
  border-color: #e5e7eb;
}

.contact-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.contact-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.role-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.role-badge.admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(240, 147, 251, 0.4);
}

.contact-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
}

.contact-email {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 8px;
}

.meta-tag.department {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.meta-tag.position {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.meta-tag i {
  font-size: 10px;
}

.contact-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn i {
  font-size: 14px;
}

.chat-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.profile-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.profile-btn:hover {
  background: #e5e7eb;
  color: #374151;
}
</style>
