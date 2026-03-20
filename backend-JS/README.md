# IMS Backend - Node.js

这是 IMS (信息管理系统) 的 Node.js 后端服务，从 Go 版本重构而来。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **ORM**: Sequelize
- **数据库**: MySQL / SQLite
- **认证**: JWT
- **日志**: Winston

## 功能模块

- 用户认证 (注册、登录、登出)
- 用户管理 (CRUD、权限控制)
- 聊天功能 (私聊)
- 房间功能 (群聊)
- 社交功能 (帖子、点赞、评论)
- 系统设置

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 启动服务器

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 项目结构

```
backend-JS/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   ├── services/        # 服务层
│   ├── utils/           # 工具函数
│   └── app.js           # 入口文件
├── .env.example         # 环境变量示例
├── package.json         # 项目配置
└── start.sh             # 启动脚本
```

## API 接口文档

### 通用说明

- 所有接口返回格式：`{ success: boolean, message: string, data: any, timestamp: string }`
- 需要认证的接口需在请求头中携带：`Authorization: Bearer <token>`
- 管理员接口需要用户角色为 `admin`

---

### 健康检查

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/health` | 服务器健康检查 | 否 |

---

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/refresh` | 刷新Token | 否 |
| POST | `/api/auth/logout` | 用户登出 | 是 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |
| GET | `/api/auth/profile` | 获取用户资料 | 是 |
| POST | `/api/auth/change-password` | 修改密码 | 是 |

#### 用户注册
```json
// POST /api/auth/register
// Request Body
{
  "username": "string",
  "password": "string",
  "email": "string",
  "fullName": "string"
}
// Response
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": { "id": 1, "username": "xxx", ... },
    "token": "jwt_token"
  }
}
```

#### 用户登录
```json
// POST /api/auth/login
// Request Body
{
  "username": "string",
  "password": "string"
}
// Response
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": { "id": 1, "username": "xxx", ... },
    "token": "jwt_token"
  }
}
```

---

### 用户接口

| 方法 | 路径 | 说明 | 认证 | 权限 |
|------|------|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 | 是 | - |
| PUT | `/api/users/me` | 更新当前用户信息 | 是 | - |
| GET | `/api/users/contacts` | 获取联系人列表 | 是 | - |
| GET | `/api/users` | 获取用户列表 | 是 | admin |
| POST | `/api/users` | 创建用户 | 是 | admin |
| GET | `/api/users/stats` | 获取用户统计 | 是 | admin |
| GET | `/api/users/:id` | 获取用户详情 | 是 | admin |
| PUT | `/api/users/:id` | 更新用户 | 是 | admin |
| DELETE | `/api/users/:id` | 删除用户 | 是 | admin |
| PATCH | `/api/users/:id/toggle` | 切换用户状态 | 是 | admin |

#### 获取用户列表
```json
// GET /api/users?page=1&limit=10
// Response
{
  "success": true,
  "message": "获取成功",
  "data": {
    "users": [...],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### 获取联系人列表
```json
// GET /api/users/contacts
// Response
{
  "success": true,
  "message": "获取成功",
  "data": {
    "contacts": [
      {
        "id": 1,
        "name": "用户名",
        "email": "user@example.com",
        "avatar": "...",
        "department": "部门",
        "position": "职位"
      }
    ],
    "total": 50
  }
}
```

---

### 个人资料接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/profile` | 获取个人资料 | 是 |
| PUT | `/api/profile` | 更新个人资料 | 是 |

---

### 仪表盘接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/dashboard/stats` | 获取仪表盘统计 | 是 |

---

### 联系人接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/contacts` | 获取联系人列表 | 是 |

---

### 聊天接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/chat/list` | 获取聊天联系人列表 | 是 |
| GET | `/api/chat/history/:userId` | 获取与某用户的聊天历史 | 是 |
| POST | `/api/chat/send` | 发送消息 | 是 |
| PUT | `/api/chat/read/:userId` | 标记消息已读 | 是 |
| GET | `/api/chat/unread` | 获取未读消息数 | 是 |
| GET | `/api/chat/admin/messages` | 获取所有消息(管理员) | 是 |
| GET | `/api/chat/admin/conversations` | 获取所有会话(管理员) | 是 |

#### 获取聊天历史
```json
// GET /api/chat/history/:userId?page=1&limit=50
// Response
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "消息内容",
        "senderId": 1,
        "senderName": "发送者",
        "receiverId": 2,
        "receiverName": "接收者",
        "isRead": true,
        "createdAt": "2026-03-20 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

#### 发送消息
```json
// POST /api/chat/send
// Request Body
{
  "receiverId": 2,
  "content": "消息内容"
}
// Response
{
  "success": true,
  "message": "发送成功",
  "data": {
    "id": 1,
    "content": "消息内容",
    "senderId": 1,
    "senderName": "发送者",
    "receiverId": 2,
    "receiverName": "接收者",
    "isRead": false,
    "createdAt": "2026-03-20 10:00:00"
  }
}
```

---

### 房间接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/social/rooms/public` | 获取公开房间列表 | 是 |
| GET | `/api/social/rooms/my` | 获取我的房间列表 | 是 |
| POST | `/api/social/rooms` | 创建房间 | 是 |
| GET | `/api/social/rooms/:id` | 获取房间详情 | 是 |
| DELETE | `/api/social/rooms/:id` | 删除房间 | 是 |
| POST | `/api/social/rooms/:id/join` | 加入房间 | 是 |
| POST | `/api/social/rooms/:id/leave` | 离开房间 | 是 |
| GET | `/api/social/rooms/:id/members` | 获取房间成员 | 是 |
| GET | `/api/social/rooms/:id/messages` | 获取房间消息 | 是 |
| POST | `/api/social/rooms/:id/messages` | 发送房间消息 | 是 |

#### 获取公开房间列表
```json
// GET /api/social/rooms/public
// Response
{
  "success": true,
  "message": "获取成功",
  "data": {
    "rooms": [
      {
        "id": 1,
        "name": "房间名称",
        "description": "房间描述",
        "isPublic": true,
        "ownerId": 1,
        "ownerName": "房主名",
        "memberCount": 10,
        "messageCount": 50
      }
    ],
    "total": 5
  }
}
```

#### 创建房间
```json
// POST /api/social/rooms
// Request Body
{
  "name": "房间名称",
  "description": "房间描述"
}
// Response
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "房间名称",
    "description": "房间描述",
    "isPublic": true,
    "ownerId": 1,
    "memberCount": 1,
    "createdAt": "2026-03-20 10:00:00"
  }
}
```

#### 获取房间消息
```json
// GET /api/social/rooms/:id/messages?page=1&limit=50
// Response
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "消息内容",
        "userId": 1,
        "userName": "用户名",
        "userAvatar": "...",
        "roomId": 1,
        "createdAt": "2026-03-20 10:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

---

### 社交接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/social/posts` | 获取帖子列表 | 是 |
| POST | `/api/social/posts` | 创建帖子 | 是 |
| GET | `/api/social/posts/:id` | 获取帖子详情 | 是 |
| DELETE | `/api/social/posts/:id` | 删除帖子 | 是 |
| POST | `/api/social/posts/:id/like` | 点赞/取消点赞 | 是 |
| POST | `/api/social/posts/:id/comment` | 添加评论 | 是 |

#### 获取帖子列表
```json
// GET /api/social/posts?page=1&limit=10
// Response
{
  "success": true,
  "message": "获取成功",
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "帖子内容",
        "userId": 1,
        "userName": "用户名",
        "userAvatar": "...",
        "isPublic": true,
        "images": [],
        "likes": 10,
        "comments": 5,
        "isLiked": false,
        "createdAt": "2026-03-20 10:00:00",
        "updatedAt": "2026-03-20 10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

#### 创建帖子
```json
// POST /api/social/posts
// Request Body
{
  "content": "帖子内容",
  "isPublic": true,
  "images": ["image_url1", "image_url2"]
}
// Response
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "content": "帖子内容",
    "userId": 1,
    "userName": "用户名",
    "userAvatar": "...",
    "isPublic": true,
    "images": [],
    "likes": 0,
    "comments": 0,
    "isLiked": false,
    "createdAt": "2026-03-20 10:00:00"
  }
}
```

#### 点赞/取消点赞
```json
// POST /api/social/posts/:id/like
// Response
{
  "success": true,
  "message": "操作成功",
  "data": {
    "isLiked": true
  }
}
```

#### 添加评论
```json
// POST /api/social/posts/:id/comment
// Request Body
{
  "content": "评论内容"
}
// Response
{
  "success": true,
  "message": "评论成功",
  "data": {
    "id": 1,
    "content": "评论内容",
    "userId": 1,
    "userName": "用户名",
    "userAvatar": "...",
    "postId": 1,
    "createdAt": "2026-03-20 10:00:00"
  }
}
```

---

### 系统接口

| 方法 | 路径 | 说明 | 认证 | 权限 |
|------|------|------|------|------|
| GET | `/api/system/settings` | 获取系统设置 | 是 | admin |
| PUT | `/api/system/settings` | 更新系统设置 | 是 | admin |
| POST | `/api/system/backup` | 备份数据库 | 是 | admin |

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

## 开发说明

### 添加新接口

1. 在 `src/models/` 中定义数据模型
2. 在 `src/services/` 中实现业务逻辑
3. 在 `src/controllers/` 中实现控制器
4. 在 `src/routes/index.js` 中添加路由

### 数据库迁移

项目使用 Sequelize 自动同步数据库，无需手动迁移。

## 许可证

MIT
