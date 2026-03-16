import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import { ROUTE_NAMES, USER_ROLES, STORAGE_KEYS } from '@/constants'
import { storage } from '@/utils'
import MainLayout from '@/layouts/MainLayout.vue'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@/views/auth/Login.vue'),
    meta: { guest: true, title: '登录' }
  },
  {
    path: '/register',
    name: ROUTE_NAMES.REGISTER,
    component: () => import('@/views/auth/Register.vue'),
    meta: { guest: true, title: '注册' }
  },
  // 主布局路由 - 所有需要侧边栏的页面
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: ROUTE_NAMES.DASHBOARD,
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'profile',
        name: ROUTE_NAMES.PROFILE,
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人资料' }
      },
      {
        path: 'contacts',
        name: ROUTE_NAMES.CONTACTS,
        component: () => import('@/views/Contacts.vue'),
        meta: { title: '联系人' }
      },
      {
        path: 'chat',
        name: ROUTE_NAMES.CHAT,
        component: () => import('@/views/Chat.vue'),
        meta: { title: '消息中心' }
      },
      {
        path: 'posts',
        name: ROUTE_NAMES.POSTS,
        component: () => import('@/views/Posts.vue'),
        meta: { title: '说说' }
      },
      {
        path: 'rooms',
        name: ROUTE_NAMES.ROOMS,
        component: () => import('@/views/Rooms.vue'),
        meta: { title: '圈子' }
      },
      {
        path: 'room/:id',
        name: ROUTE_NAMES.ROOM_CHAT,
        component: () => import('@/views/RoomChat.vue'),
        meta: { title: '房间聊天' }
      },
      {
        path: 'users',
        name: ROUTE_NAMES.USERS,
        component: () => import('@/views/Users.vue'),
        meta: { 
          requiresAdmin: true, 
          title: '用户管理',
          icon: 'fas fa-users'
        }
      },
      {
        path: 'settings',
        name: ROUTE_NAMES.SETTINGS,
        component: () => import('@/views/Settings.vue'),
        meta: { 
          requiresAdmin: true, 
          title: '系统设置',
          icon: 'fas fa-cog'
        }
      }
    ]
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 白名单路由（不需要登录）
const whiteList = ['/login', '/register']

// 全局前置守卫
router.beforeEach(async (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const userStore = useUserStore()
  const token = storage.get<string>(STORAGE_KEYS.TOKEN, null)
  const userRole = storage.get<string>(STORAGE_KEYS.USER_ROLE, null)

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 信息管理系统` : '信息管理系统'

  // 1. 已登录用户访问登录/注册页，重定向到仪表盘
  if (to.meta.guest && token) {
    next('/dashboard')
    return
  }

  // 2. 需要登录的页面，但未登录
  if (to.meta.requiresAuth && !token) {
    message.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 3. 需要管理员权限的页面
  if (to.meta.requiresAdmin && userRole !== USER_ROLES.ADMIN) {
    message.error('您没有权限访问此页面')
    next('/dashboard')
    return
  }

  // 4. 如果有 token 且用户信息未加载，尝试获取用户信息
  if (token && !userStore.user && !whiteList.includes(to.path)) {
    try {
      await userStore.fetchUserInfo()
      next()
    } catch {
      userStore.logout()
      message.error('登录已过期，请重新登录')
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
    return
  }

  // 默认放行
  next()
})

export default router
