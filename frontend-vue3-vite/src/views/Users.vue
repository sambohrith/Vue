<template>
  <div class="users-page">
    <div class="page-header-section">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">
            <i class="fas fa-users-cog"></i>
            <span>用户管理</span>
          </h1>
          <p class="page-subtitle">管理系统用户，分配角色和权限</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ users.length }}</span>
            <span class="stat-label">总用户</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ users.filter(u => u.role === 'admin').length }}</span>
            <span class="stat-label">管理员</span>
          </div>
        </div>
      </div>
    </div>

    <div class="users-card">
      <div class="filter-bar">
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索用户名、姓名或邮箱..."
            class="search-input"
          />
        </div>
        <a-select
          v-model:value="roleFilter"
          placeholder="所有角色"
          class="filter-select"
          allow-clear
        >
          <a-select-option value="admin">管理员</a-select-option>
          <a-select-option value="user">普通用户</a-select-option>
        </a-select>
        <a-select
          v-model:value="statusFilter"
          placeholder="所有状态"
          class="filter-select"
          allow-clear
        >
          <a-select-option value="true">已激活</a-select-option>
          <a-select-option value="false">已禁用</a-select-option>
        </a-select>
        <a-button class="reset-btn" @click="resetFilters">
          <i class="fas fa-undo"></i>
          重置
        </a-button>
        <a-button type="primary" class="add-btn" @click="showAddUserModal = true">
          <i class="fas fa-plus"></i>
          添加用户
        </a-button>
      </div>

      <a-table
        :loading="loading"
        :data-source="filteredUsers"
        :columns="columns"
        :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 位用户` }"
        row-key="id"
        class="users-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <div class="user-avatar">
              {{ record.fullName?.charAt(0) || record.username?.charAt(0) || '?' }}
            </div>
          </template>
          <template v-if="column.key === 'userInfo'">
            <div class="user-info-cell">
              <div class="user-name">{{ record.fullName || record.username }}</div>
              <div class="user-username">@{{ record.username }}</div>
            </div>
          </template>
          <template v-if="column.key === 'role'">
            <span class="role-tag" :class="record.role">
              <i :class="record.role === 'admin' ? 'fas fa-crown' : 'fas fa-user'"></i>
              {{ record.role === 'admin' ? '管理员' : '普通用户' }}
            </span>
          </template>
          <template v-if="column.key === 'isActive'">
            <span class="status-badge" :class="{ active: record.isActive }">
              <span class="status-dot"></span>
              {{ record.isActive ? '已激活' : '已禁用' }}
            </span>
          </template>
          <template v-if="column.key === 'contact'">
            <div class="contact-cell">
              <div><i class="fas fa-envelope"></i>{{ record.email }}</div>
              <div v-if="record.phone" class="phone">
                <i class="fas fa-phone"></i>{{ record.phone }}
              </div>
            </div>
          </template>
          <template v-if="column.key === 'department'">
            <div class="dept-cell">
              <div>{{ record.department || '-' }}</div>
              <div v-if="record.position" class="position">{{ record.position }}</div>
            </div>
          </template>
          <template v-if="column.key === 'lastLogin'">
            <span class="last-login">{{ record.lastLogin || '从未登录' }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <div class="action-btns">
              <a-tooltip title="编辑">
                <a-button type="text" class="action-btn edit-btn" @click="editUser(record)">
                  <i class="fas fa-edit"></i>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="record.isActive ? '禁用' : '激活'">
                <a-button type="text" class="action-btn" :class="record.isActive ? 'disable-btn' : 'enable-btn'" @click="toggleUserStatus(record.id, !record.isActive)">
                  <i :class="record.isActive ? 'fas fa-ban' : 'fas fa-check-circle'"></i>
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除">
                <a-button type="text" class="action-btn delete-btn" @click="deleteUser(record.id)">
                  <i class="fas fa-trash"></i>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:open="dialogVisible"
      :title="showEditUserModal ? '编辑用户' : '添加用户'"
      width="650px"
      :confirm-loading="loading"
      @ok="saveUser"
      @cancel="closeModal"
      class="user-modal"
    >
      <a-form
        :model="formData"
        layout="vertical"
        class="user-form"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" required>
              <a-input
                v-model:value="formData.username"
                placeholder="请输入用户名"
                :disabled="showEditUserModal"
                prefix="@"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input v-model:value="formData.fullName" placeholder="请输入姓名" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="邮箱" required>
              <a-input v-model:value="formData.email" placeholder="请输入邮箱" type="email">
                <template #prefix>
                  <i class="fas fa-envelope text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input v-model:value="formData.phone" placeholder="请输入手机号" type="tel">
                <template #prefix>
                  <i class="fas fa-phone text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="部门">
              <a-input v-model:value="formData.department" placeholder="请输入部门">
                <template #prefix>
                  <i class="fas fa-building text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="职位">
              <a-input v-model:value="formData.position" placeholder="请输入职位">
                <template #prefix>
                  <i class="fas fa-briefcase text-gray-400"></i>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="角色">
              <a-select v-model:value="formData.role">
                <a-select-option value="user">
                  <i class="fas fa-user mr-2"></i>普通用户
                </a-select-option>
                <a-select-option value="admin">
                  <i class="fas fa-crown mr-2"></i>管理员
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="formData.status">
                <a-select-option value="true">
                  <a-badge status="success" text="已激活" />
                </a-select-option>
                <a-select-option value="false">
                  <a-badge status="error" text="已禁用" />
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="密码" v-if="!showEditUserModal" required>
          <a-input-password v-model:value="formData.password" placeholder="请输入密码">
            <template #prefix>
              <i class="fas fa-lock text-gray-400"></i>
            </template>
          </a-input-password>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { userApi } from '../api'
import type { User } from '../types'
import { message, Modal } from 'ant-design-vue'

const loading = ref(false)
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const dialogVisible = computed(() => showAddUserModal.value || showEditUserModal.value)
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

const columns = [
  { title: '', key: 'avatar', width: 60, align: 'center' as const },
  { title: '用户信息', key: 'userInfo', width: 150 },
  { title: '联系方式', key: 'contact', width: 200 },
  { title: '部门/职位', key: 'department', width: 150 },
  { title: '角色', key: 'role', width: 120, align: 'center' as const },
  { title: '状态', key: 'isActive', width: 100, align: 'center' as const },
  { title: '最后登录', key: 'lastLogin', width: 150 },
  { title: '操作', key: 'action', width: 150, align: 'center' as const, fixed: 'right' as const }
]

const formData = ref({
  id: 0,
  username: '',
  fullName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  role: 'user',
  status: 'true',
  password: ''
})

const users = ref<User[]>([])

const filteredUsers = computed(() => {
  let result = users.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.includes(query))
    )
  }
  
  if (roleFilter.value) {
    result = result.filter(user => user.role === roleFilter.value)
  }
  
  if (statusFilter.value) {
    result = result.filter(user => user.isActive === (statusFilter.value === 'true'))
  }
  
  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await userApi.getUsers({
      page: 1,
      limit: 9999,
      search: '',
      role: '',
      isActive: ''
    })
    users.value = response.users
  } catch (error) {
    console.error('Load users error:', error)
    message.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

watch([searchQuery, roleFilter, statusFilter], () => {
  // 前端筛选，无需重新加载
})

const editUser = (user: User) => {
  formData.value = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    department: user.department || '',
    position: user.position || '',
    role: user.role,
    status: user.isActive?.toString() || 'true',
    password: ''
  }
  showEditUserModal.value = true
}

const toggleUserStatus = async (userId: number, status: boolean) => {
  try {
    await userApi.updateUserStatus(userId, status)
    await loadUsers()
    message.success(status ? '用户已激活' : '用户已禁用')
  } catch (error) {
    console.error('Toggle user status error:', error)
    message.error('操作失败，请稍后重试')
  }
}

const deleteUser = async (userId: number) => {
  Modal.confirm({
    title: '删除用户',
    content: '确定要删除这个用户吗？此操作不可恢复。',
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await userApi.deleteUser(userId)
        await loadUsers()
        message.success('用户已删除')
      } catch (error) {
        console.error('Delete user error:', error)
        message.error('删除失败，请稍后重试')
      }
    }
  })
}

const saveUser = async () => {
  loading.value = true
  try {
    if (showEditUserModal.value) {
      await userApi.updateUser(formData.value.id, {
        fullName: formData.value.fullName,
        email: formData.value.email,
        phone: formData.value.phone,
        department: formData.value.department,
        position: formData.value.position,
        role: formData.value.role as 'admin' | 'user',
        isActive: formData.value.status === 'true'
      })
      message.success('用户更新成功')
    } else {
      await userApi.createUser({
        username: formData.value.username,
        fullName: formData.value.fullName,
        email: formData.value.email,
        phone: formData.value.phone,
        department: formData.value.department,
        position: formData.value.position,
        role: formData.value.role as 'admin' | 'user',
        password: formData.value.password
      })
      message.success('用户创建成功')
    }
    
    closeModal()
    await loadUsers()
  } catch (error: any) {
    console.error('Save user error:', error)
    message.error(error.message || '保存失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showAddUserModal.value = false
  showEditUserModal.value = false
  formData.value = {
    id: 0,
    username: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'user',
    status: 'true',
    password: ''
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page {
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

.header-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.85;
}

.users-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
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

.filter-select {
  width: 140px;
}

.reset-btn {
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.users-table {
  margin-top: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.user-info-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
}

.user-username {
  font-size: 12px;
  color: #6b7280;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-tag.admin {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.role-tag.user {
  background: #eff6ff;
  color: #3b82f6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.status-badge .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.status-badge.active .status-dot {
  background: #10b981;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-cell i {
  color: #9ca3af;
  margin-right: 6px;
  font-size: 12px;
}

.contact-cell .phone {
  color: #6b7280;
  font-size: 12px;
}

.dept-cell {
  display: flex;
  flex-direction: column;
}

.dept-cell .position {
  color: #6b7280;
  font-size: 12px;
}

.last-login {
  color: #6b7280;
}

.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f3f4f6;
}

.edit-btn {
  color: #3b82f6;
}

.disable-btn {
  color: #f59e0b;
}

.enable-btn {
  color: #10b981;
}

.delete-btn {
  color: #ef4444;
}

.user-modal :deep(.ant-modal-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

.user-modal :deep(.ant-modal-body) {
  padding: 24px;
}

.user-form :deep(.ant-form-item-label) {
  font-weight: 500;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-stats {
    align-self: flex-end;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
