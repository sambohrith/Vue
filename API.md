# IMS-Vue API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

## 通用响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 错误响应格式

```json
{
  "success": false,
  "message": "错误信息",
  "code": 400
}
```

---

## 认证相关 API

### 1. 用户注册

**POST** `/auth/register`

无需认证

**请求体**:
```json
{
  "username": "string (必填, 最大50字符)",
  "email": "string (必填, 最大100字符)",
  "password": "string (必填)",
  "fullName": "string (可选, 最大100字符)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "role": "user",
      "isActive": true
    },
    "token": "jwt_token_string"
  }
}
```

---

### 2. 用户登录

**POST** `/auth/login`

无需认证

**请求体**:
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "avatar": null,
      "role": "user",
      "isActive": true,
      "lastLoginAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_string"
  }
}
```

---

### 3. 刷新Token

**POST** `/auth/refresh`

无需认证

**请求体**:
```json
{
  "token": "string (必填, 旧的JWT Token)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "token": "new_jwt_token_string"
  }
}
```

---

### 4. 用户登出

**POST** `/auth/logout`

需要认证

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "登出成功",
  "data": null
}
```

---

### 5. 获取当前用户信息

**GET** `/auth/me`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "avatar": null,
      "phone": null,
      "department": null,
      "position": null,
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 6. 获取用户资料

**GET** `/auth/profile`

需要认证

**响应**: 同 `/auth/me`

---

### 7. 修改密码

**POST** `/auth/change-password`

需要认证

**请求体**:
```json
{
  "currentPassword": "string (必填, 当前密码)",
  "newPassword": "string (必填, 新密码)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码修改成功",
  "data": null
}
```

---

## 用户管理 API (管理员)

> 以下接口需要管理员权限 (`role: admin`)

### 8. 获取用户列表

**GET** `/users`

需要认证 + 管理员权限

**查询参数**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 10 | 每页数量 |
| search | string | - | 搜索关键词 |
| role | string | - | 角色筛选 |
| isActive | boolean | - | 状态筛选 |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "Administrator",
        "avatar": null,
        "phone": null,
        "department": null,
        "position": null,
        "role": "admin",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "lastLoginAt": "2024-01-01T00:00:00.000Z"
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

### 9. 创建用户

**POST** `/users`

需要认证 + 管理员权限

**请求体**:
```json
{
  "username": "string (必填)",
  "email": "string (必填)",
  "password": "string (必填)",
  "fullName": "string (可选)",
  "phone": "string (可选)",
  "department": "string (可选)",
  "position": "string (可选)",
  "role": "string (可选, 默认 user)",
  "isActive": "boolean (可选, 默认 true)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "user": {
      "id": 2,
      "username": "newuser",
      "email": "newuser@example.com",
      "fullName": "New User",
      "role": "user",
      "isActive": true
    }
  }
}
```

---

### 10. 获取单个用户

**GET** `/users/:id`

需要认证 + 管理员权限

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 用户ID |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "Administrator"
    }
  }
}
```

---

### 11. 更新用户

**PUT** `/users/:id`

需要认证 + 管理员权限

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 用户ID |

**请求体**:
```json
{
  "fullName": "string (可选)",
  "phone": "string (可选)",
  "department": "string (可选)",
  "position": "string (可选)",
  "role": "string (可选)",
  "isActive": "boolean (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户更新成功",
  "data": {
    "user": {}
  }
}
```

---

### 12. 删除用户

**DELETE** `/users/:id`

需要认证 + 管理员权限

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 用户ID |

**响应**:
```json
{
  "success": true,
  "message": "用户已删除",
  "data": null
}
```

---

### 13. 切换用户状态

**PATCH** `/users/:id/toggle`

需要认证 + 管理员权限

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 用户ID |

**响应**:
```json
{
  "success": true,
  "message": "用户已禁用/已启用",
  "data": {
    "user": {}
  }
}
```

---

### 14. 获取用户统计

**GET** `/users/stats`

需要认证 + 管理员权限

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total": 100,
    "active": 90,
    "inactive": 10,
    "admins": 5
  }
}
```

---

## 个人中心 API

### 15. 获取个人信息

**GET** `/users/me` 或 `/profile`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "avatar": null,
    "phone": null,
    "gender": null,
    "bio": null,
    "skills": null,
    "department": null,
    "position": null,
    "role": "user",
    "isActive": true
  }
}
```

---

### 16. 更新个人信息

**PUT** `/users/me` 或 `/profile`

需要认证

**请求体**:
```json
{
  "fullName": "string (可选)",
  "avatar": "string (可选)",
  "phone": "string (可选)",
  "gender": "string (可选)",
  "bio": "string (可选)",
  "skills": "string (可选)",
  "department": "string (可选)",
  "position": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": {}
}
```

---

### 17. 获取联系人列表

**GET** `/users/contacts` 或 `/contacts`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "contacts": [
      {
        "id": 2,
        "username": "user2",
        "fullName": "User Two",
        "avatar": null
      }
    ],
    "total": 10
  }
}
```

---

### 18. 获取仪表盘统计

**GET** `/dashboard/stats`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "users": 100,
    "rooms": 20,
    "posts": 50,
    "messages": 1000
  }
}
```

---

## 聊天 API

### 19. 获取聊天列表

**GET** `/chat/list`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "contacts": [
      {
        "id": 2,
        "username": "user2",
        "fullName": "User Two",
        "avatar": null,
        "lastMessage": {
          "content": "Hello",
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "unreadCount": 5
      }
    ],
    "total": 10
  }
}
```

---

### 20. 获取聊天记录

**GET** `/chat/history/:userId`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| userId | int | 对方用户ID |

**查询参数**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 50 | 每页数量 |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "senderId": 1,
        "receiverId": 2,
        "content": "Hello",
        "isRead": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

---

### 21. 发送消息

**POST** `/chat/send`

需要认证

**请求体**:
```json
{
  "receiverId": "int (必填, 接收者ID)",
  "content": "string (必填, 消息内容)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "发送成功",
  "data": {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "content": "Hello",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 22. 标记消息已读

**PUT** `/chat/read/:userId`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| userId | int | 对方用户ID |

**响应**:
```json
{
  "success": true,
  "message": "已标记为已读",
  "data": null
}
```

---

### 23. 获取未读消息数

**GET** `/chat/unread`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "total": 10,
    "byUser": [
      {
        "senderId": 2,
        "count": 5
      }
    ]
  }
}
```

---

### 24. 获取所有消息 (管理员)

**GET** `/chat/admin/messages`

需要认证 + 管理员权限

**查询参数**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 20 | 每页数量 |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [],
    "pagination": {}
  }
}
```

---

### 25. 获取所有会话 (管理员)

**GET** `/chat/admin/conversations`

需要认证 + 管理员权限

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "conversations": []
  }
}
```

---

## 社交动态 API

### 26. 获取帖子列表

**GET** `/social/posts`

需要认证

**查询参数**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 10 | 每页数量 |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "posts": [
      {
        "id": 1,
        "userId": 1,
        "content": "Hello World!",
        "images": null,
        "likesCount": 10,
        "commentsCount": 5,
        "isLiked": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": 1,
          "username": "testuser",
          "fullName": "Test User",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 27. 创建帖子

**POST** `/social/posts`

需要认证

**请求体**:
```json
{
  "content": "string (必填, 帖子内容)",
  "images": "string (可选, 图片URL, 多个用逗号分隔)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "content": "Hello World!",
    "images": null,
    "likesCount": 0,
    "commentsCount": 0
  }
}
```

---

### 28. 删除帖子

**DELETE** `/social/posts/:id`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 帖子ID |

**响应**:
```json
{
  "success": true,
  "message": "帖子已删除",
  "data": null
}
```

---

### 29. 点赞/取消点赞

**POST** `/social/posts/:id/like`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 帖子ID |

**响应**:
```json
{
  "success": true,
  "message": "点赞成功/取消点赞",
  "data": {
    "liked": true,
    "likesCount": 11
  }
}
```

---

### 30. 添加评论

**POST** `/social/posts/:id/comment`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 帖子ID |

**请求体**:
```json
{
  "content": "string (必填, 评论内容)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "评论成功",
  "data": {
    "id": 1,
    "postId": 1,
    "userId": 1,
    "content": "Nice post!",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 聊天室 API

### 31. 获取公开聊天室

**GET** `/social/rooms/public`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "rooms": [
      {
        "id": 1,
        "name": "General",
        "description": "General chat room",
        "avatar": null,
        "isPublic": true,
        "createdBy": 1,
        "membersCount": 50,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

---

### 32. 获取我的聊天室

**GET** `/social/rooms/my`

需要认证

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "rooms": [],
    "total": 5
  }
}
```

---

### 33. 获取聊天室详情

**GET** `/social/rooms/:id`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "General",
    "description": "General chat room",
    "avatar": null,
    "isPublic": true,
    "createdBy": 1,
    "membersCount": 50,
    "isMember": true
  }
}
```

---

### 34. 创建聊天室

**POST** `/social/rooms`

需要认证

**请求体**:
```json
{
  "name": "string (必填, 聊天室名称)",
  "description": "string (可选, 描述)",
  "avatar": "string (可选, 头像URL)",
  "isPublic": "boolean (可选, 默认 true)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "My Room",
    "description": null,
    "isPublic": true
  }
}
```

---

### 35. 删除聊天室

**DELETE** `/social/rooms/:id`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**响应**:
```json
{
  "success": true,
  "message": "房间已删除",
  "data": null
}
```

---

### 36. 加入聊天室

**POST** `/social/rooms/:id/join`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**响应**:
```json
{
  "success": true,
  "message": "加入成功",
  "data": null
}
```

---

### 37. 离开聊天室

**POST** `/social/rooms/:id/leave`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**响应**:
```json
{
  "success": true,
  "message": "已离开房间",
  "data": null
}
```

---

### 38. 获取聊天室成员

**GET** `/social/rooms/:id/members`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "members": [
      {
        "id": 1,
        "username": "testuser",
        "fullName": "Test User",
        "avatar": null,
        "joinedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 39. 获取聊天室消息

**GET** `/social/rooms/:id/messages`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**查询参数**:
| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 50 | 每页数量 |

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "id": 1,
        "roomId": 1,
        "userId": 1,
        "content": "Hello everyone!",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": 1,
          "username": "testuser",
          "fullName": "Test User",
          "avatar": null
        }
      }
    ],
    "pagination": {}
  }
}
```

---

### 40. 发送聊天室消息

**POST** `/social/rooms/:id/messages`

需要认证

**路径参数**:
| 参数 | 类型 | 描述 |
|------|------|------|
| id | int | 聊天室ID |

**请求体**:
```json
{
  "content": "string (必填, 消息内容)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "发送成功",
  "data": {
    "id": 1,
    "roomId": 1,
    "userId": 1,
    "content": "Hello everyone!"
  }
}
```

---

## 系统管理 API (管理员)

> 以下接口需要管理员权限 (`role: admin`)

### 41. 获取系统设置

**GET** `/system/settings`

需要认证 + 管理员权限

**响应**:
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "siteName": "IMS-Vue",
    "siteDescription": "Information Management System",
    "allowRegistration": true,
    "maxUploadSize": 10
  }
}
```

---

### 42. 更新系统设置

**PUT** `/system/settings`

需要认证 + 管理员权限

**请求体**:
```json
{
  "siteName": "string (可选)",
  "siteDescription": "string (可选)",
  "allowRegistration": "boolean (可选)",
  "maxUploadSize": "int (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": {}
}
```

---

### 43. 备份数据库

**POST** `/system/backup`

需要认证 + 管理员权限

**响应**:
```json
{
  "success": true,
  "message": "备份成功",
  "data": {
    "filename": "backup_20240101_120000.sql",
    "size": 1024000,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 健康检查

### 44. 服务健康检查

**GET** `/health`

无需认证

**响应**:
```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 错误码说明

| HTTP状态码 | 描述 |
|-----------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证说明

所有需要认证的接口，请在请求头中携带 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

Token 有效期默认为 24 小时，可通过 `/auth/refresh` 接口刷新。

---

## 角色权限说明

| 角色 | 权限 |
|------|------|
| user | 基础功能：个人信息管理、聊天、社交动态、聊天室 |
| admin | 所有功能：用户管理、系统设置、数据备份等 |
