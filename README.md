# 信息管理系统 (IMS-Vue)

全栈信息管理系统，采用前后端分离架构。支持用户管理、实时聊天、圈子动态等功能。

## 项目结构

```
Vue/
├── frontend-vue3-vite/    # Vue 3 + Vite 前端
│   ├── src/              # 源代码
│   │   ├── api/          # API 接口
│   │   ├── components/   # 公共组件
│   │   ├── views/        # 页面视图
│   │   ├── router/       # 路由配置
│   │   ├── stores/       # Pinia 状态管理
│   │   └── styles/       # 样式文件
│   ├── package.json      # 前端依赖配置
│   └── vite.config.ts    # Vite 配置
├── backend-JS/            # Node.js + Express 后端
│   ├── src/              # 源代码
│   │   ├── controllers/  # 控制器
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由配置
│   │   ├── services/     # 业务逻辑层
│   │   └── utils/        # 工具函数
│   ├── package.json      # 后端依赖配置
│   ├── .env.development  # 开发环境配置
│   └── .env.production   # 生产环境配置
├── .gitignore            # Git 忽略文件
├── DEVELOPMENT.md        # 开发文档
└── README.md             # 项目说明
```

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript (v3.5.30)
- **构建工具**: Vite (v8.0.1)
- **UI 组件**: Ant Design Vue (v4.2.6)
- **样式**: Tailwind CSS (v4.2.2)
- **状态管理**: Pinia (v3.0.4)
- **HTTP 客户端**: Axios (v1.13.6)

### 后端
- **语言**: Node.js 18+
- **Web 框架**: Express (v5.2.1)
- **ORM**: Sequelize (v6.37.8)
- **数据库**: MySQL (v8.0+)
- **认证**: JWT (jsonwebtoken v9.0.3)
- **日志**: Winston (v3.19.0)
- **配置**: dotenv (v17.3.1)

## 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+

### 1. 克隆项目并安装依赖

```bash
# 安装前端依赖
cd frontend-vue3-vite
npm install

# 安装后端依赖
cd ../backend-JS
npm install
```

### 2. 配置环境

**后端配置** `backend-JS/.env.development`:

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置 (MySQL)
DB_DRIVER=mysql
DB_HOST=106.15.91.86
DB_PORT=3306
DB_NAME=ims
DB_USER=ims
DB_PASSWORD=ChPPkF6NdarARhzn

# JWT 配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# CORS 配置
CORS_ORIGINS=http://localhost:3000
```

**前端配置** `frontend-vue3-vite/.env.development`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. 启动开发服务器

**前端开发服务器**:

```bash
cd frontend-vue3-vite
npm run dev
```

**后端开发服务器**:

```bash
cd backend-JS
npm run dev
```

### 4. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- API 健康检查: http://localhost:3001/api/health

## 可用脚本

### 前端脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 |
| `npm run build` | 构建前端生产版本 |
| `npm run preview` | 预览前端生产构建 |

### 后端脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动后端开发服务器 (nodemon 模式) |
| `npm start` | 启动后端生产服务器 |

## API 接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新Token
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/auth/profile` - 获取用户资料
- `POST /api/auth/change-password` - 修改密码

### 用户接口
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新当前用户信息
- `GET /api/users/contacts` - 获取联系人列表
- `GET /api/users` - 获取用户列表 (管理员)
- `POST /api/users` - 创建用户 (管理员)
- `GET /api/users/stats` - 获取用户统计 (管理员)
- `GET /api/users/:id` - 获取用户详情 (管理员)
- `PUT /api/users/:id` - 更新用户 (管理员)
- `DELETE /api/users/:id` - 删除用户 (管理员)
- `PATCH /api/users/:id/toggle` - 切换用户状态 (管理员)

### 个人资料接口
- `GET /api/profile` - 获取个人资料
- `PUT /api/profile` - 更新个人资料

### 仪表盘接口
- `GET /api/dashboard/stats` - 获取仪表盘统计

### 联系人接口
- `GET /api/contacts` - 获取联系人列表

### 聊天接口
- `GET /api/chat/list` - 获取聊天联系人列表
- `GET /api/chat/history/:userId` - 获取与某用户的聊天历史
- `POST /api/chat/send` - 发送消息
- `PUT /api/chat/read/:userId` - 标记消息已读
- `GET /api/chat/unread` - 获取未读消息数
- `GET /api/chat/admin/messages` - 获取所有消息 (管理员)
- `GET /api/chat/admin/conversations` - 获取所有会话 (管理员)

### 房间接口
- `GET /api/social/rooms/public` - 获取公开房间列表
- `GET /api/social/rooms/my` - 获取我的房间列表
- `POST /api/social/rooms` - 创建房间
- `GET /api/social/rooms/:id` - 获取房间详情
- `DELETE /api/social/rooms/:id` - 删除房间
- `POST /api/social/rooms/:id/join` - 加入房间
- `POST /api/social/rooms/:id/leave` - 离开房间
- `GET /api/social/rooms/:id/members` - 获取房间成员
- `GET /api/social/rooms/:id/messages` - 获取房间消息
- `POST /api/social/rooms/:id/messages` - 发送房间消息

### 社交接口
- `GET /api/social/posts` - 获取帖子列表
- `POST /api/social/posts` - 创建帖子
- `GET /api/social/posts/:id` - 获取帖子详情
- `DELETE /api/social/posts/:id` - 删除帖子
- `POST /api/social/posts/:id/like` - 点赞/取消点赞
- `POST /api/social/posts/:id/comment` - 添加评论

### 系统接口
- `GET /api/system/settings` - 获取系统设置 (管理员)
- `PUT /api/system/settings` - 更新系统设置 (管理员)
- `POST /api/system/backup` - 备份数据库 (管理员)

## 功能特性

- 🔐 **用户认证** - JWT 认证，支持登录/注册/密码修改
- 👥 **用户管理** - 管理员可管理用户（CRUD、启用/禁用）
- 💬 **实时聊天** - 用户间私信聊天
- 🏠 **圈子系统** - 创建/加入房间，群聊功能
- 📝 **动态发布** - 发布说说、点赞、评论
- 👤 **个人资料** - 编辑个人信息
- 📊 **仪表盘** - 数据统计概览
- ⚙️ **系统设置** - 管理员配置

## 后端特性

- ✅ RESTful API 设计
- ✅ JWT 认证与授权
- ✅ 角色权限控制 (RBAC)
- ✅ 请求限流保护
- ✅ 结构化日志 (Winston)
- ✅ 日志自动轮转
- ✅ 统一响应格式
- ✅ 请求追踪 (Request ID)
- ✅ 优雅关闭
- ✅ 自动数据库迁移
- ✅ MySQL 数据库支持

## 生产部署

### 前端构建

```bash
cd frontend-vue3-vite
npm run build
```

构建产物位于 `dist/` 目录。

### 后端部署

Node.js 后端无需编译，直接启动即可：

```bash
cd backend-JS
npm start
```

## 默认账号

系统启动时会自动创建默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`
- 邮箱: `admin@example.com`

> 生产环境请修改默认密码！

## 目录说明

### 前端目录 (`frontend-vue3-vite/`)
- `src/api/` - API 接口定义
- `src/components/` - 公共组件
- `src/views/` - 页面视图
- `src/router/` - Vue Router 路由
- `src/stores/` - Pinia 状态管理
- `src/styles/` - 全局样式

### 后端目录 (`backend-JS/`)
- `src/app.js` - 应用程序入口
- `src/controllers/` - HTTP 请求处理器
- `src/services/` - 业务逻辑层
- `src/models/` - 数据模型和数据库操作
- `src/middleware/` - Express 中间件
- `src/routes/` - 路由配置
- `src/utils/` - 可复用的工具函数

## 开发计划

- [ ] WebSocket 实时消息推送
- [ ] 文件上传 (头像、图片)
- [ ] 消息已读回执
- [ ] 邮件通知
- [ ] 数据导出

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License