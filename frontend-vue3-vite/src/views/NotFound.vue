<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <a-button type="primary" size="large" @click="goHome">
          <i class="fas fa-home mr-2"></i>
          返回首页
        </a-button>
        <a-button size="large" @click="goBack">
          <i class="fas fa-arrow-left mr-2"></i>
          返回上一页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  color: white;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 20px;
  opacity: 0.9;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
}

.error-desc {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 640px) {
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-actions {
    flex-direction: column;
  }
}
</style>
