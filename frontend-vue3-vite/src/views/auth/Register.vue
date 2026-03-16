<template>
  <div class="register-container">
    <a-card class="register-card" :hoverable="true">
      <div class="register-header text-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">信息管理系统</h2>
        <p class="text-gray-600">创建新账号</p>
      </div>
      <a-form @submit.prevent="handleRegister" :model="registerForm">
        <a-form-item>
          <a-input
            v-model:value="registerForm.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <i class="fas fa-user text-gray-400"></i>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-input
            v-model:value="registerForm.name"
            placeholder="请输入姓名"
            size="large"
          >
            <template #prefix>
              <i class="fas fa-id-card text-gray-400"></i>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-input
            v-model:value="registerForm.email"
            placeholder="请输入邮箱"
            size="large"
            type="email"
          >
            <template #prefix>
              <i class="fas fa-envelope text-gray-400"></i>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-input-password
            v-model:value="registerForm.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix>
              <i class="fas fa-lock text-gray-400"></i>
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-input-password
            v-model:value="registerForm.confirmPassword"
            placeholder="请确认密码"
            size="large"
          >
            <template #prefix>
              <i class="fas fa-lock text-gray-400"></i>
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="large" class="w-full" :loading="loading" html-type="submit">
            {{ loading ? '注册中...' : '注册' }}
          </a-button>
        </a-form-item>
        <div class="login-link text-center text-sm text-gray-600 mt-4">
          已有账号？
          <router-link to="/login" class="text-blue-500 font-medium hover:text-blue-600">立即登录</router-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'

const router = useRouter()
const userStore = useUserStore()

const registerForm = reactive({
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

const handleRegister = async () => {
  if (registerForm.password !== registerForm.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    await userStore.register(
      registerForm.username,
      registerForm.password,
      registerForm.name,
      registerForm.email
    )
    
    message.success('注册成功，正在跳转...')
    router.push('/dashboard')
  } catch (error: any) {
    console.error('Register error:', error)
    message.error(error.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
}

.register-header {
  margin-bottom: 2rem;
}

.login-link {
  text-align: center;
  font-size: 0.875rem;
  color: #4a5568;
  margin-top: 1rem;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.login-link a:hover {
  color: #5a67d8;
  text-decoration: underline;
}
</style>
