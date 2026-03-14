# 开发指南

## 快速开始

### 方式一：使用 Node.js 脚本（推荐，跨平台）

```bash
# 启动前后端服务
npm start
# 或
npm run dev

# 仅启动前端
npm run dev:frontend

# 仅启动后端
npm run dev:backend
```

### 方式二：使用 PowerShell 脚本（Windows）

```powershell
# 启动前后端服务
.\start-dev.ps1

# 仅启动前端
.\start-dev.ps1 -SkipBackend

# 仅启动后端
.\start-dev.ps1 -SkipFrontend

# 显示帮助
.\start-dev.ps1 -Help
```

### 方式三：使用 Batch 脚本（Windows）

```batch
# 启动前后端服务
start-dev.bat

# 仅启动前端
start-dev.bat -f

# 仅启动后端
start-dev.bat -b

# 显示帮助
start-dev.bat -h
```

## 手动启动

### 前端

```bash
cd frontend
npm install   # 首次运行
npm run dev   # 启动开发服务器
```

前端服务运行在 http://localhost:3000

### 后端

```bash
cd backend
npm install   # 首次运行
npm run dev   # 启动开发服务器
```

后端服务运行在 http://localhost:3001

## 项目结构

```
ims-vue/
├── frontend/          # Vue 3 前端
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/           # Node.js 后端
│   ├── src/
│   ├── package.json
│   └── ...
├── start-dev.js       # Node.js 启动脚本
├── start-dev.ps1      # PowerShell 启动脚本
├── start-dev.bat      # Batch 启动脚本
└── package.json
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 安装所有依赖（根目录、前端、后端） |
| `npm run build` | 构建前端生产版本 |
| `npm run clean` | 删除所有 node_modules |
| `npm run frontend:build` | 仅构建前端 |
| `npm run backend:start` | 以生产模式启动后端 |

## 端口配置

- **前端**: 3000 (Vite)
- **后端**: 3001 (Express)

如需修改端口：
- 前端：修改 `frontend/vite.config.ts` 中的 `server.port`
- 后端：修改 `backend/.env` 中的 `PORT`

## 环境变量

### 后端环境变量 (`backend/.env`)

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ims_db
JWT_SECRET=your_jwt_secret
```

### 前端环境变量 (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 调试

### 查看日志

Node.js 启动脚本会自动在日志前添加服务标识：

```
[FRONTEND] VITE v5.0.0  ready
[BACKEND] Server running on port 3001
```

### 单独查看服务日志

建议分别启动服务以查看独立日志：

```bash
# 终端 1
cd frontend && npm run dev

# 终端 2
cd backend && npm run dev
```
