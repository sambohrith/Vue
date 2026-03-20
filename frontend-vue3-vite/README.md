# 信息管理系统 - 前端

基于 Vue 3 + TypeScript + Vite 构建的现代化管理后台前端。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架 (v3.5.30)
- **TypeScript** - 类型安全的 JavaScript 超集 (v5.9.3)
- **Vite** - 下一代前端构建工具 (v8.0.1)
- **Ant Design Vue** - 企业级 UI 组件库 (v4.2.6)
- **Tailwind CSS** - 实用优先的 CSS 框架 (v4.2.2)
- **Pinia** - Vue 状态管理方案 (v3.0.4)
- **Axios** - HTTP 客户端 (v1.13.6)

## 项目结构

```
frontend-vue3-vite/
├── src/
│   ├── api/          # API 接口封装
│   ├── assets/       # 静态资源
│   ├── components/   # 公共组件
│   ├── constants/    # 常量定义
│   ├── layouts/      # 布局组件
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia 状态管理
│   ├── styles/       # 全局样式
│   ├── types/        # TypeScript 类型定义
│   ├── utils/        # 工具函数
│   └── views/        # 页面视图
│       ├── auth/      # 认证相关页面
│       ├── Chat.vue   # 聊天页面
│       ├── Contacts.vue # 联系人页面
│       ├── Dashboard.vue # 仪表盘
│       ├── Posts.vue  # 社交帖子页面
│       ├── Profile.vue # 个人资料
│       ├── Rooms.vue  # 房间列表
│       └── Settings.vue # 系统设置
├── public/           # 公共资源
├── .env.development  # 开发环境配置
├── .env.production   # 生产环境配置
├── package.json      # 项目配置
├── vite.config.ts    # Vite 配置
└── tsconfig.json     # TypeScript 配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 环境配置

### 开发环境配置 (.env.development)

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 生产环境配置 (.env.production)

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## 后端服务

后端服务运行在 `http://localhost:3001`，详见 `backend-JS/` 文件夹。

## 端口配置

- 前端: `http://localhost:3000`
- 后端: `http://localhost:3001`

## 功能特性

- 🔐 **用户认证** - 登录、注册、密码修改
- 👥 **联系人管理** - 查看所有用户
- 💬 **聊天功能** - 一对一私信
- 🏠 **房间系统** - 群聊房间
- 📝 **社交动态** - 发布、点赞、评论
- 👤 **个人资料** - 查看和更新个人信息
- 📊 **仪表盘** - 数据统计概览
- ⚙️ **系统设置** - 管理员配置

## 路由结构

- `/login` - 登录页
- `/register` - 注册页
- `/dashboard` - 仪表盘
- `/chat` - 聊天页面
- `/contacts` - 联系人列表
- `/posts` - 社交动态
- `/rooms` - 房间列表
- `/room/:id` - 房间聊天
- `/profile` - 个人资料
- `/settings` - 系统设置

## 开发注意事项

1. **TypeScript 类型**：所有 API 接口和组件都应有完整的类型定义
2. **响应式设计**：使用 Tailwind CSS 确保界面在不同设备上的兼容性
3. **错误处理**：所有 API 调用都应有适当的错误处理
4. **状态管理**：使用 Pinia 管理全局状态，避免 props 层级传递
5. **代码规范**：遵循 Vue 3 组合式 API 最佳实践

## 构建优化

- **代码分割**：使用 Vite 的自动代码分割
- **图片优化**：使用响应式图片和适当的压缩
- **依赖分析**：定期检查和优化依赖包
- **缓存策略**：合理使用浏览器缓存

## 许可证

MIT License