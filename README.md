# 信息管理系统 (IMS-Vue)

全栈信息管理系统，采用前后端分离架构。

## 项目结构

```
ims-vue/
├── frontend/          # Vue 3 前端
│   ├── src/          # 源代码
│   ├── package.json  # 前端依赖
│   └── vite.config.ts
├── backend/           # Node.js + Express 后端
│   ├── src/          # 源代码
│   ├── package.json  # 后端依赖
│   └── server.js
├── .env              # 环境变量
└── package.json      # 根项目脚本
```

## 快速开始

### 1. 安装所有依赖

```bash
npm run install:all
```

或分别安装：

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. 启动开发服务器

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

### 3. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前后端开发服务器 |
| `npm run frontend:dev` | 仅启动前端开发服务器 |
| `npm run frontend:build` | 构建前端生产版本 |
| `npm run backend:dev` | 仅启动后端开发服务器 |
| `npm run backend:start` | 以生产模式启动后端 |
| `npm run build` | 构建前端生产版本 |
| `npm run install:all` | 安装根目录、前端和后端的所有依赖 |

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Ant Design Vue
- Tailwind CSS
- Pinia

### 后端
- Node.js
- Express
- MySQL (Sequelize ORM)
- JWT 认证

## 环境配置

后端需要在 `backend/.env` 中配置数据库连接：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ims_db
JWT_SECRET=your_jwt_secret
PORT=3001
```

前端可以在 `frontend/.env` 中配置 API 地址：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 功能特性

- 🔐 用户认证（登录/注册）
- 👥 用户管理（管理员）
- 💬 实时聊天
- 🏠 圈子/房间系统
- 📝 说说/动态发布
- ⚙️ 系统设置
