# 信息管理系统 (IMS-Vue)

全栈信息管理系统，采用前后端分离架构。支持用户管理、实时聊天、圈子动态等功能。

## 项目结构

```
ims-vue/
├── frontend-vue3-vite/    # Vue 3 + Vite 前端
│   ├── src/              # 源代码
│   │   ├── api/          # API 接口
│   │   ├── components/   # 公共组件
│   │   ├── views/        # 页面视图
│   │   ├── router/       # 路由配置
│   │   ├── stores/       # Pinia 状态管理
│   │   └── styles/       # 样式文件
│   ├── package.json
│   └── vite.config.ts
├── backend-go/            # Go + Gin 后端
│   ├── cmd/              # 程序入口
│   ├── config/           # 配置文件
│   ├── internal/         # 内部代码
│   │   ├── handlers/     # HTTP 处理器
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由配置
│   │   └── services/     # 业务逻辑层
│   ├── pkg/              # 公共包
│   │   ├── logger/       # 日志
│   │   └── utils/        # 工具函数
│   ├── go.mod
│   └── config.yaml
├── .env                  # 环境变量
└── package.json          # 根项目脚本
```

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件**: Element Plus
- **样式**: Tailwind CSS
- **状态管理**: Pinia
- **HTTP 客户端**: Axios

### 后端
- **语言**: Go 1.21+
- **Web 框架**: Gin
- **ORM**: GORM
- **数据库**: MySQL / PostgreSQL / SQLite
- **认证**: JWT
- **日志**: Zap + Lumberjack
- **配置**: Viper

## 快速开始

### 环境要求
- Node.js 18+
- Go 1.21+
- MySQL 8.0+ (或 SQLite)

### 1. 克隆项目并安装依赖

```bash
# 安装前端依赖
cd frontend-vue3-vite
npm install

# 安装后端依赖
cd ../backend-go
go mod download
```

或使用根目录脚本：

```bash
npm run install:all
```

### 2. 配置环境

**后端配置** `backend-go/config/config.yaml`:

```yaml
server:
  port: 3001
  mode: development
  allowed_origins:
    - http://localhost:3000

database:
  driver: mysql      # 可选: mysql, postgres, sqlite
  host: localhost
  port: 3306
  name: ims_db
  user: root
  password: your_password

jwt:
  secret: your-secret-key
  expiration: 24h
```

或使用环境变量：

```bash
export IMS_DATABASE_PASSWORD=your_password
export IMS_JWT_SECRET=your-secret-key
```

**前端配置** `frontend-vue3-vite/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. 启动开发服务器

同时启动前后端：

```bash
npm run dev
```

或分别启动：

```bash
# 前端
npm run frontend:dev

# 后端
npm run backend:dev
```

### 4. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- API 文档: http://localhost:3001/api/health

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前后端开发服务器 |
| `npm run frontend:dev` | 仅启动前端开发服务器 |
| `npm run frontend:build` | 构建前端生产版本 |
| `npm run frontend:preview` | 预览前端生产构建 |
| `npm run backend:dev` | 启动后端开发服务器 (nodemon 模式) |
| `npm run backend:start` | 启动后端生产服务器 |
| `npm run build` | 构建前端生产版本 |
| `npm run install:all` | 安装所有依赖 |

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/auth/profile` - 获取个人资料
- `POST /api/auth/change-password` - 修改密码
- `POST /api/auth/refresh` - 刷新令牌

### 用户管理 (管理员)
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `PATCH /api/users/:id/toggle` - 切换用户状态
- `GET /api/users/stats` - 用户统计

### 个人资料
- `GET /api/profile` - 获取我的信息
- `PUT /api/profile` - 更新个人资料

### 仪表盘
- `GET /api/dashboard/stats` - 仪表盘统计

### 联系人
- `GET /api/contacts` - 获取所有联系人

### 聊天
- `GET /api/chat/messages/:userId` - 获取聊天记录
- `POST /api/chat/messages` - 发送消息
- `GET /api/chat/conversations` - 获取会话列表

### 社交
- `GET /api/social/posts` - 获取动态列表
- `POST /api/social/posts` - 发布动态
- `GET /api/social/rooms` - 获取房间列表
- `POST /api/social/rooms` - 创建房间

### 系统
- `GET /api/health` - 健康检查
- `GET /api/system/settings` - 获取系统设置
- `PUT /api/system/settings` - 更新系统设置

## 功能特性

- 🔐 **用户认证** - JWT 认证，支持登录/注册/密码修改
- 👥 **用户管理** - 管理员可管理用户（CRUD、启用/禁用）
- 💬 **实时聊天** - 用户间私信聊天
- 🏠 **圈子系统** - 创建/加入房间，群聊功能
- 📝 **动态发布** - 发布说说、点赞、评论
- 👤 **个人资料** - 编辑个人信息、头像
- 📊 **仪表盘** - 数据统计概览
- ⚙️ **系统设置** - 管理员配置

## 后端特性

- ✅ RESTful API 设计
- ✅ JWT 认证与授权
- ✅ 角色权限控制 (RBAC)
- ✅ 请求限流保护
- ✅ 结构化日志 (Zap)
- ✅ 日志自动轮转
- ✅ 统一响应格式
- ✅ 请求追踪 (Request ID)
- ✅ 优雅关闭
- ✅ 自动数据库迁移
- ✅ 多数据库支持 (MySQL/PostgreSQL/SQLite)

## 生产部署

### 前端构建

```bash
cd frontend-vue3-vite
npm run build
```

构建产物位于 `dist/` 目录。

### 后端构建

```bash
cd backend-go
go build -o ims-server cmd/main.go
```

### Docker 部署 (可选)

```bash
# 构建镜像
docker build -t ims-vue .

# 运行容器
docker run -d -p 3000:3000 -p 3001:3001 ims-vue
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
- `src/composables/` - Vue Composition API 组合函数

### 后端目录 (`backend-go/`)
- `cmd/` - 应用程序入口
- `internal/handlers/` - HTTP 请求处理器
- `internal/services/` - 业务逻辑层
- `internal/models/` - 数据模型和数据库操作
- `internal/middleware/` - Gin 中间件
- `internal/routes/` - 路由配置
- `pkg/` - 可复用的公共包

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
