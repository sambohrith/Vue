<template>
  <MainLayout>
    <div class="profile-page p-6">
      <div class="header-actions flex justify-end mb-6">
        <a-button type="primary" @click="saveProfile" :loading="loading" id="save-profile-btn">
          <i class="fas fa-check mr-2"></i>
          {{ loading ? '保存中...' : '保存修改' }}
        </a-button>
      </div>
      <div class="profile-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        <a-card :hoverable="true" class="profile-card">
          <div class="card-body text-center">
            <div class="profile-avatar-large">
              <i class="fas fa-user" style="font-size: 48px;"></i>
              <a-button class="avatar-edit" circle size="small" type="primary">
                <i class="fas fa-camera"></i>
              </a-button>
            </div>
            <h3 id="profile-name" class="text-xl font-semibold text-gray-800 mb-2">{{ userProfile.fullName }}</h3>
            <p id="profile-email" class="text-gray-600 mb-3">{{ userProfile.email }}</p>
            <a-tag id="profile-role" :color="userStore.user?.role === 'admin' ? 'warning' : 'info'">
              {{ userRole }}
            </a-tag>
          </div>
        </a-card>
        <a-card :hoverable="true" class="lg:col-span-2">
          <template #header>
            <h3 class="font-semibold">基本信息</h3>
          </template>
          <a-form :model="userProfile" label-width="100px">
            <a-row :gutter="20">
              <a-col :span="12">
                <a-form-item label="用户名">
                  <a-input v-model:value="userProfile.username" disabled />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="姓名">
                  <a-input v-model:value="userProfile.fullName" placeholder="请输入姓名" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="20">
              <a-col :span="12">
                <a-form-item label="手机号">
                  <a-input v-model:value="userProfile.phone" placeholder="请输入手机号" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="部门">
                  <a-input v-model:value="userProfile.department" placeholder="请输入部门" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="20">
              <a-col :span="12">
                <a-form-item label="职位">
                  <a-input v-model:value="userProfile.position" placeholder="请输入职位" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="个人简介">
              <a-textarea
                v-model:value="userProfile.bio"
                :rows="4"
                placeholder="请输入个人简介"
              />
            </a-form-item>
          </a-form>
        </a-card>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { useUserStore } from '../stores/user'
import { userApi } from '../api'
import type { User } from '../types'
import { message } from 'ant-design-vue'

const userStore = useUserStore()
const loading = ref(false)

const userRole = computed(() => userStore.user?.role === 'admin' ? '管理员' : '普通用户')

const userProfile = ref<Partial<User>>({
  username: userStore.user?.username || '',
  fullName: userStore.user?.fullName || '',
  email: userStore.user?.email || '',
  phone: userStore.user?.phone || '',
  department: userStore.user?.department || '',
  position: userStore.user?.position || '',
  bio: userStore.user?.bio || ''
})

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
      bio: user.bio || ''
    }
  } catch (error) {
    console.error('Load profile error:', error)
  }
}

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

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.profile-page {
  width: 100%;
}

.profile-avatar-large {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #9ca3af;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
}

.card-body {
  padding: 1.5rem;
}

.profile-card .card-body {
  text-align: center;
}
</style>
