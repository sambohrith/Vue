# IMS API 文档 (C# 后端)

> 基于 .NET 10 开发的后端 API 文档

## 目录

- [基础信息](#基础信息)
- [认证方式](#认证方式)
- [通用响应格式](#通用响应格式)
- [API 端点](#api-端点)
  - [健康检查](#健康检查)
  - [认证模块](#认证模块)
  - [用户模块](#用户模块)
  - [个人资料模块](#个人资料模块)
  - [联系人模块](#联系人模块)
  - [仪表盘模块](#仪表盘模块)
  - [聊天模块](#聊天模块)
  - [社交模块](#社交模块)
  - [房间模块](#房间模块)
  - [系统模块](#系统模块)

---

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **编码**: UTF-8

---

## 认证方式

API 使用 **JWT (JSON Web Token)** 进行认证。

### 获取 Token

通过登录接口获取：
```http
POST /api/auth/login
```

### 使用 Token

在请求头中添加 Authorization：
```http
Authorization: Bearer <your-jwt-token>
```

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "abc123"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "abc123"
}
```

### 验证错误响应

```json
{
  "success": false,
  "message": "数据验证失败",
  "data": {
    "fieldName": "字段错误信息"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "abc123"
}
```

---

## API 端点

### 健康检查

#### 检查服务状态

```http
GET /api/health
```

**响应示例**:
```json
{
  "success": true,
  "message": "服务器运行正常",
  "data": {
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 认证模块

#### 用户注册

```http
POST /api/auth/register
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-50字符 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，至少6位 |
| fullName | string | 否 | 全名 |

**请求示例**:
```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "123456",
  "fullName": "张三"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "fullName": "张三",
      "role": "user",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### 用户登录

```http
POST /api/auth/login
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**请求示例**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ims.com",
      "fullName": "系统管理员",
      "role": "admin",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### 用户登出

```http
POST /api/auth/logout
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

#### 获取当前用户信息

```http
GET /api/auth/me
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ims.com",
      "fullName": "系统管理员",
      "avatar": null,
      "department": null,
      "position": null,
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

#### 获取个人资料

```http
GET /api/auth/profile
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ims.com",
      "fullName": "系统管理员",
      "avatar": null,
      "phone": null,
      "gender": null,
      "bio": null,
      "skills": null,
      "department": null,
      "position": null,
      "role": "admin",
      "isActive": true
    }
  }
}
```

---

#### 修改密码

```http
POST /api/auth/change-password
```

**请求头**:
```http
Authorization: Bearer <token>
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码，至少6位 |

**请求示例**:
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

#### 刷新令牌

```http
POST /api/auth/refresh
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 旧的 JWT Token |

**请求示例**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 用户模块

#### 获取用户列表

```http
GET /api/users?page=1&limit=10&search=&role=&isActive=
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**查询参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词（用户名/邮箱/全名） |
| role | string | 否 | 角色过滤 |
| isActive | string | 否 | 状态过滤（true/false） |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@ims.com",
        "fullName": "系统管理员",
        "role": "admin",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

#### 获取单个用户

```http
GET /api/users/{id}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ims.com",
      "fullName": "系统管理员",
      "role": "admin",
      "isActive": true
    }
  }
}
```

---

#### 创建用户

```http
POST /api/users
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-50字符 |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码，至少6位 |
| fullName | string | 否 | 全名 |
| department | string | 否 | 部门 |
| position | string | 否 | 职位 |
| role | string | 否 | 角色（默认user） |

**请求示例**:
```json
{
  "username": "lisi",
  "email": "lisi@example.com",
  "password": "123456",
  "fullName": "李四",
  "department": "技术部",
  "position": "工程师",
  "role": "user"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "user": {
      "id": 2,
      "username": "lisi",
      "email": "lisi@example.com",
      "fullName": "李四",
      "role": "user",
      "isActive": true
    }
  }
}
```

---

#### 更新用户

```http
PUT /api/users/{id}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名 |
| email | string | 否 | 邮箱 |
| password | string | 否 | 密码 |
| role | string | 否 | 角色 |
| isActive | boolean | 否 | 是否激活 |
| fullName | string | 否 | 全名 |

**响应示例**:
```json
{
  "success": true,
  "message": "用户更新成功",
  "data": {
    "user": { ... }
  }
}
```

---

#### 删除用户

```http
DELETE /api/users/{id}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**响应示例**:
```json
{
  "success": true,
  "message": "用户已删除"
}
```

---

#### 切换用户状态

```http
PATCH /api/users/{id}/toggle
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 用户ID |

**响应示例**:
```json
{
  "success": true,
  "message": "用户已禁用",
  "data": {
    "user": { ... }
  }
}
```

---

#### 获取用户统计

```http
GET /api/users/stats
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total": 100,
    "active": 80,
    "admins": 5,
    "recentUsers": [ ... ]
  }
}
```

---

### 个人资料模块

#### 获取我的信息

```http
GET /api/users/me
GET /api/profile
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@ims.com",
    "fullName": "系统管理员",
    "avatar": null,
    "phone": null,
    "gender": null,
    "bio": null,
    "skills": null,
    "department": null,
    "position": null,
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

#### 更新我的信息

```http
PUT /api/users/me
PUT /api/profile
```

**请求头**:
```http
Authorization: Bearer <token>
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fullName | string | 否 | 全名 |
| phone | string | 否 | 电话 |
| department | string | 否 | 部门 |
| position | string | 否 | 职位 |
| gender | string | 否 | 性别 |
| bio | string | 否 | 简介 |
| skills | string | 否 | 技能 |

**响应示例**:
```json
{
  "success": true,
  "message": "信息更新成功",
  "data": { ... }
}
```

---

### 联系人模块

#### 获取所有联系人

```http
GET /api/contacts
GET /api/users/contacts
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@ims.com",
      "fullName": "系统管理员",
      "avatar": null,
      "department": null,
      "position": null,
      "role": "admin",
      "isActive": true
    }
  ]
}
```

---

### 仪表盘模块

#### 获取仪表盘统计

```http
GET /api/dashboard/stats
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "totalUsers": 100,
    "onlineUsers": 80,
    "adminUsers": 5,
    "activeUsers": 80,
    "totalPosts": 50,
    "totalRooms": 10,
    "totalMessages": 1000,
    "system": {
      "nodeVersion": "10.0",
      "platform": "Win32NT",
      "uptime": 3600,
      "memoryUsage": {},
      "serverTime": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

---

### 聊天模块

#### 获取聊天列表

```http
GET /api/chat/list
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "contacts": [
      {
        "id": 2,
        "userId": 2,
        "name": "李四",
        "email": "lisi@example.com",
        "avatar": null,
        "lastMessage": "你好",
        "lastMessageTime": "2024-01-01 12:00:00",
        "unreadCount": 5
      }
    ],
    "total": 10
  }
}
```

---

#### 获取聊天历史

```http
GET /api/chat/history/{userId}?page=1&limit=50
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | long | 对方用户ID |

**查询参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认50 |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "你好",
        "senderId": 2,
        "senderName": "李四",
        "receiverId": 1,
        "receiverName": "管理员",
        "isRead": true,
        "createdAt": "2024-01-01 12:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

---

#### 发送消息

```http
POST /api/chat/send
```

**请求头**:
```http
Authorization: Bearer <token>
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| receiverId | long | 是 | 接收者ID |
| content | string | 是 | 消息内容 |

**请求示例**:
```json
{
  "receiverId": 2,
  "content": "你好，这是一条测试消息"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "发送成功",
  "data": {
    "id": 1,
    "content": "你好，这是一条测试消息",
    "senderId": 1,
    "senderName": "管理员",
    "receiverId": 2,
    "receiverName": "李四",
    "isRead": false,
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

---

#### 标记消息已读

```http
PUT /api/chat/read/{userId}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | long | 对方用户ID |

**响应示例**:
```json
{
  "success": true,
  "message": "标记成功",
  "data": {
    "markedCount": 5
  }
}
```

---

#### 获取未读消息数

```http
GET /api/chat/unread
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "unreadCount": 10
  }
}
```

---

#### 管理员获取所有消息

```http
GET /api/chat/admin/messages?page=1&limit=50&search=
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**查询参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认50 |
| search | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [ ... ],
    "total": 1000
  }
}
```

---

#### 管理员获取所有对话

```http
GET /api/chat/admin/conversations?page=1&limit=50&search=
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "conversations": [ ... ],
    "total": 100
  }
}
```

---

### 社交模块

#### 获取帖子列表

```http
GET /api/social/posts?page=1&limit=10
```

**请求头**:
```http
Authorization: Bearer <token>
```

**查询参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| limit | int | 否 | 每页数量，默认10 |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "今天天气真好！",
        "userId": 1,
        "userName": "管理员",
        "userAvatar": null,
        "isPublic": true,
        "createdAt": "2024-01-01 12:00:00",
        "updatedAt": "2024-01-01 12:00:00",
        "likes": 10,
        "comments": 5,
        "images": [],
        "isLiked": false
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 创建帖子

```http
POST /api/social/posts
```

**请求头**:
```http
Authorization: Bearer <token>
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 帖子内容 |
| isPublic | boolean | 否 | 是否公开，默认true |
| images | array | 否 | 图片URL数组 |

**请求示例**:
```json
{
  "content": "分享今天的好心情！",
  "isPublic": true,
  "images": []
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "content": "分享今天的好心情！",
    "userId": 1,
    "userName": "管理员",
    "userAvatar": null,
    "isPublic": true,
    "createdAt": "2024-01-01 12:00:00",
    "updatedAt": "2024-01-01 12:00:00",
    "likes": 0,
    "comments": 0,
    "images": [],
    "isLiked": false
  }
}
```

---

#### 删除帖子

```http
DELETE /api/social/posts/{id}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 帖子ID |

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

#### 点赞/取消点赞

```http
POST /api/social/posts/{id}/like
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 帖子ID |

**响应示例**:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "isLiked": true,
    "likes": 11
  }
}
```

---

#### 添加评论

```http
POST /api/social/posts/{id}/comment
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 帖子ID |

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 评论内容 |

**响应示例**:
```json
{
  "success": true,
  "message": "评论成功",
  "data": {
    "id": 1,
    "content": "说得好！",
    "userId": 2,
    "userName": "李四",
    "userAvatar": null,
    "postId": 1,
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

---

#### 获取评论列表

```http
GET /api/social/posts/{id}/comments?page=1&limit=20
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 帖子ID |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "comments": [ ... ],
    "total": 20,
    "page": 1,
    "limit": 20
  }
}
```

---

### 房间模块

#### 获取公开房间

```http
GET /api/social/rooms/public
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "rooms": [
      {
        "id": 1,
        "name": "技术交流群",
        "description": "讨论技术话题",
        "isPublic": true,
        "ownerId": 1,
        "ownerName": "管理员",
        "memberCount": 10,
        "createdAt": "2024-01-01 12:00:00",
        "messageCount": 100
      }
    ],
    "total": 5
  }
}
```

---

#### 获取我的房间

```http
GET /api/social/rooms/my
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**: 同上

---

#### 获取房间详情

```http
GET /api/social/rooms/{id}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**路径参数**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | long | 房间ID |

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "技术交流群",
    "description": "讨论技术话题",
    "isPublic": true,
    "ownerId": 1,
    "ownerName": "管理员",
    "memberCount": 10,
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

---

#### 创建房间

```http
POST /api/social/rooms
```

**请求头**:
```http
Authorization: Bearer <token>
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 房间名称 |
| description | string | 否 | 房间描述 |
| isPublic | boolean | 否 | 是否公开，默认true |

**响应示例**:
```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "新房间",
    "description": "房间描述",
    "isPublic": true,
    "ownerId": 1,
    "ownerName": "管理员",
    "memberCount": 1,
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

---

#### 删除房间

```http
DELETE /api/social/rooms/{id}
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: 房主或 Admin

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

#### 加入房间

```http
POST /api/social/rooms/{id}/join
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "加入成功"
}
```

---

#### 离开房间

```http
POST /api/social/rooms/{id}/leave
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "离开成功"
}
```

---

#### 获取房间成员

```http
GET /api/social/rooms/{id}/members
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "members": [
      {
        "id": 1,
        "roomId": 1,
        "userId": 1,
        "userName": "管理员",
        "userAvatar": null,
        "role": "owner",
        "joinedAt": "2024-01-01 12:00:00"
      }
    ],
    "total": 10
  }
}
```

---

#### 获取房间消息

```http
GET /api/social/rooms/{id}/messages?page=1&limit=50
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "content": "欢迎大家！",
        "userId": 1,
        "userName": "管理员",
        "userAvatar": null,
        "roomId": 1,
        "createdAt": "2024-01-01 12:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50
  }
}
```

---

#### 发送房间消息

```http
POST /api/social/rooms/{id}/messages
```

**请求头**:
```http
Authorization: Bearer <token>
```

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 消息内容 |

**响应示例**:
```json
{
  "success": true,
  "message": "发送成功",
  "data": {
    "id": 2,
    "content": "大家好！",
    "userId": 2,
    "userName": "李四",
    "userAvatar": null,
    "roomId": 1,
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

---

### 系统模块

#### 获取系统设置

```http
GET /api/system/settings
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**响应示例**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "siteName": "信息管理系统",
    "siteLogo": "",
    "siteDescription": "企业级信息管理解决方案",
    "passwordMinLength": 8,
    "loginAttempts": 5,
    "enable2FA": false,
    "enableIPRestriction": false,
    "enableEmailNotifications": true,
    "enableSystemNotifications": true,
    "notificationEmail": "admin@ims.com",
    "backupFrequency": "weekly",
    "backupRetention": 30
  }
}
```

---

#### 更新系统设置

```http
PUT /api/system/settings
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| siteName | string | 否 | 站点名称 |
| siteLogo | string | 否 | 站点Logo |
| siteDescription | string | 否 | 站点描述 |
| passwordMinLength | int | 否 | 密码最小长度 |
| loginAttempts | int | 否 | 登录尝试次数 |
| enable2FA | boolean | 否 | 启用2FA |
| enableIPRestriction | boolean | 否 | 启用IP限制 |
| enableEmailNotifications | boolean | 否 | 启用邮件通知 |
| enableSystemNotifications | boolean | 否 | 启用系统通知 |
| notificationEmail | string | 否 | 通知邮箱 |
| backupFrequency | string | 否 | 备份频率 |
| backupRetention | int | 否 | 备份保留天数 |

**响应示例**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": { ... }
}
```

---

#### 备份数据库

```http
POST /api/system/backup
```

**请求头**:
```http
Authorization: Bearer <token>
```

**权限**: Admin

**响应示例**:
```json
{
  "success": true,
  "message": "备份成功",
  "data": {
    "success": true,
    "message": "数据库备份成功",
    "backupPath": "/backups/backup_20240101_120000.sql",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或Token无效） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 技术栈

- **框架**: .NET 10
- **数据库**: SQLite (默认), MySQL, PostgreSQL, SQL Server
- **ORM**: Entity Framework Core 10
- **认证**: JWT
- **密码加密**: MD5
- **日志**: Serilog
- **文档**: Swagger

---

*文档版本: 1.0.0*
*最后更新: 2024年*
