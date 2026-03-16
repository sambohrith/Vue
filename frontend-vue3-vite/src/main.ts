import { createApp } from 'vue'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import { useUserStore } from '@/stores/user'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@fortawesome/fontawesome-free/css/all.css'

// 创建应用实例
const app = createApp(App)

// 注册插件
app.use(pinia)

// 恢复用户登录状态（必须在注册 pinia 之后，router 之前）
const userStore = useUserStore()
userStore.restoreFromStorage()

app.use(router)
app.use(Antd)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// 挂载应用
app.mount('#app')
