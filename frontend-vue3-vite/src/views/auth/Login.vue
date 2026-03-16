<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header text-center mb-6">
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">信息管理系统</h2>
        <p class="text-gray-600">请登录您的账号</p>
      </div>
      <a-form @submit.prevent="handleLogin" :model="loginForm">
        <a-form-item>
          <a-input
            v-model:value="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <i class="fas fa-user text-gray-400"></i>
            </template>
          </a-input>
        </a-form-item>
        <a-form-item>
          <a-input-password
            v-model:value="loginForm.password"
            placeholder="请输入密码"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <i class="fas fa-lock text-gray-400"></i>
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <div class="form-actions flex justify-between items-center w-full">
            <a-checkbox v-model:checked="loginForm.remember">记住我</a-checkbox>
            <a-button type="link">忘记密码？</a-button>
          </div>
        </a-form-item>
        <a-form-item>
          <a-button 
            type="primary" 
            size="large" 
            class="w-full" 
            :loading="loading" 
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </a-button>
        </a-form-item>
        <div class="register-link text-center text-sm text-gray-600 mt-4">
          还没有账号？
          <router-link to="/register" class="text-blue-500 font-medium hover:text-blue-600">立即注册</router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loading = ref(false)

// 如果已登录，直接跳转
onMounted(() => {
  console.log('[Login] Mounted, isLoggedIn:', userStore.isLoggedIn)
  if (userStore.isLoggedIn) {
    const redirect = route.query.redirect as string || '/dashboard'
    console.log('[Login] Already logged in, redirect to:', redirect)
    router.replace(redirect)
  }
})

const handleLogin = async () => {
  console.log('[Login] Attempting login...')
  
  // 表单验证
  if (!loginForm.username.trim()) {
    message.warning('请输入用户名')
    return
  }
  if (!loginForm.password) {
    message.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    console.log('[Login] Calling userStore.login...')
    await userStore.login(loginForm.username.trim(), loginForm.password)
    
    console.log('[Login] Login success, user:', userStore.user)
    console.log('[Login] Token:', userStore.token)
    console.log('[Login] isAdmin:', userStore.isAdmin)
    
    message.success('登录成功')
    
    // 获取跳转地址，默认去仪表盘
    const redirect = route.query.redirect as string || '/dashboard'
    console.log('[Login] Redirecting to:', redirect)
    
    // 使用 replace 避免返回时再次进入登录页
    await router.replace(redirect)
    console.log('[Login] Navigation completed')
    
  } catch (error: any) {
    console.error('[Login] Login failed:', error)
    message.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.login-header {
  margin-bottom: 2rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.register-link {
  text-align: center;
  font-size: 0.875rem;
  color: #4a5568;
  margin-top: 1rem;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.register-link a:hover {
  color: #5a67d8;
  text-decoration: underline;
}
</style>
