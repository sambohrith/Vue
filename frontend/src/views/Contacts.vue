<template>
  <div class="contacts-page">
      <a-card :hoverable="true">
        <template #title>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <i class="fas fa-users"></i>
              <span class="font-semibold">用户列表</span>
            </div>
            <div class="flex items-center gap-3">
              <a-input
                v-model:value="searchQuery"
                placeholder="搜索用户..."
                class="w-64"
                id="contacts-search"
              >
                <template #prefix>
                  <i class="fas fa-search text-gray-400"></i>
                </template>
              </a-input>
              <a-button
                id="contacts-refresh-btn"
                shape="circle"
                @click="refreshContacts"
                title="刷新列表"
              >
                <i class="fas fa-sync"></i>
              </a-button>
            </div>
          </div>
        </template>
        <div class="contacts-list">
          <a-spin :spinning="loading" class="min-h-[200px]">
            <a-empty v-if="!loading && contacts.length === 0" description="暂无联系人" />
            <div v-else class="contacts-grid">
              <div class="contact-card" v-for="contact in filteredContacts" :key="contact.id">
                <div class="contact-avatar-wrapper">
                  <a-avatar :size="56" class="contact-avatar">
                    <i class="fas fa-user text-lg"></i>
                  </a-avatar>
                  <span v-if="contact.role === 'admin'" class="role-badge admin">管理员</span>
                </div>
                <div class="contact-details">
                  <h4 class="contact-name">{{ contact.fullName }}</h4>
                  <p class="contact-email">{{ contact.email }}</p>
                  <div class="contact-meta">
                    <span v-if="contact.department" class="meta-tag">
                      {{ contact.department }}
                    </span>
                    <span v-if="contact.position" class="meta-tag">
                      {{ contact.position }}
                    </span>
                  </div>
                </div>
                <div class="contact-actions">
                  <a-button
                    type="primary"
                    shape="circle"
                    size="small"
                    @click="startChat(contact.id, contact.fullName)"
                    title="发送消息"
                  >
                    <i class="fas fa-comment"></i>
                  </a-button>
                  <a-button
                    shape="circle"
                    size="small"
                    @click="viewProfile(contact.id)"
                    title="查看资料"
                  >
                    <i class="fas fa-info-circle"></i>
                  </a-button>
                </div>
              </div>
            </div>
          </a-spin>
        </div>
      </a-card>
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
    contact.fullName.toLowerCase().includes(query) ||
    contact.email.toLowerCase().includes(query) ||
    contact.username.toLowerCase().includes(query)
  )
})

const refreshContacts = async () => {
  loading.value = true
  try {
    const response = await userApi.getContacts()
    // 后端返回 { users: [...] } 格式
    contacts.value = (response as any).users || (response as any) || []
  } catch (error) {
    console.error('Refresh contacts error:', error)
    contacts.value = []
  } finally {
    loading.value = false
  }
}

const startChat = (userId: number, fullName: string) => {
  router.push(`/chat?userId=${userId}&userName=${fullName}`)
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
}

.contacts-list {
  max-height: 600px;
  overflow-y: auto;
}

/* 网格布局 */
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .contacts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .contacts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 联系卡片样式 */
.contact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.contact-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #d1d5db;
}

/* 头像区域 */
.contact-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.contact-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.role-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  padding: 2px 6px;
  font-size: 0.625rem;
  font-weight: 600;
  border-radius: 9999px;
  white-space: nowrap;
}

.role-badge.admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

/* 联系信息区域 */
.contact-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.contact-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
}

.contact-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* 元信息标签 */
.contact-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #f3f4f6;
  border-radius: 4px;
}

/* 操作按钮区域 */
.contact-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
</style>
