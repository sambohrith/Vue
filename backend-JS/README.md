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

## API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 用户接口
- `GET /api/users` - 获取用户列表 (管理员)
- `POST /api/users` - 创建用户 (管理员)
- `GET /api/users/:id` - 获取用户详情 (管理员)
- `PUT /api/users/:id` - 更新用户 (管理员)
- `DELETE /api/users/:id` - 删除用户 (管理员)

### 聊天接口
- `GET /api/chat/list` - 获取聊天联系人
- `GET /api/chat/history/:userId` - 获取聊天历史
- `POST /api/chat/send` - 发送消息

### 房间接口
- `GET /api/social/rooms/public` - 获取公开房间
- `GET /api/social/rooms/my` - 获取我的房间
- `POST /api/social/rooms` - 创建房间
- `POST /api/social/rooms/:id/join` - 加入房间

### 社交接口
- `GET /api/social/posts` - 获取帖子列表
- `POST /api/social/posts` - 创建帖子
- `POST /api/social/posts/:id/like` - 点赞/取消点赞
- `POST /api/social/posts/:id/comment` - 添加评论

### 系统接口
- `GET /api/system/settings` - 获取系统设置 (管理员)
- `PUT /api/system/settings` - 更新系统设置 (管理员)

## 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

## 从 Go 版本迁移

本项目从 Go 后端重构，保持了相同的 API 接口和数据库结构，确保前端可以无缝切换。
