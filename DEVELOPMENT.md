# 开发指南

## 环境要求

- **Node.js**: 18+
- **Go**: 1.21+
- **数据库**: MySQL 8.0+ (或 SQLite)

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

### 前端 (Vue3 + Vite)

```bash
cd frontend-vue3-vite
npm install   # 首次运行
npm run dev   # 启动开发服务器
```

前端服务运行在 http://localhost:3000

### 后端 (Go + Gin)

```bash
cd backend-go

# 下载依赖（首次运行）
go mod download

# 启动开发服务器
go run cmd/main.go

# 或编译后运行
go build -o ims-server cmd/main.go
./ims-server
```

后端服务运行在 http://localhost:3001

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
│   │   └── main.go
│   ├── config/           # 配置文件
│   │   ├── config.go
│   │   └── config.yaml
│   ├── internal/         # 内部代码
│   │   ├── handlers/     # HTTP 处理器
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由配置
│   │   └── services/     # 业务逻辑层
│   ├── pkg/              # 公共包
│   │   ├── logger/       # Zap 日志
│   │   └── utils/        # 工具函数
│   ├── go.mod
│   └── config.yaml
├── start-dev.js          # Node.js 启动脚本
├── start-dev.ps1         # PowerShell 启动脚本
├── start-dev.bat         # Batch 启动脚本
└── package.json
```

## 常用命令

### 根目录命令

| 命令 | 说明 |
|------|------|
| `npm run install:all` | 安装所有依赖 |
| `npm run dev` | 同时启动前后端开发服务器 |
| `npm run dev:frontend` | 仅启动前端开发服务器 |
| `npm run dev:backend` | 仅启动后端开发服务器 |
| `npm run build` | 构建前端生产版本 |
| `npm run clean` | 删除所有 node_modules |

### 前端命令

```bash
cd frontend-vue3-vite

npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run type-check   # TypeScript 类型检查
```

### 后端命令

```bash
cd backend-go

go run cmd/main.go              # 启动开发服务器
go build -o ims-server cmd/main.go   # 编译为可执行文件
./ims-server                     # 运行编译后的程序
go mod download                  # 下载依赖
go mod tidy                      # 整理依赖
go test ./...                    # 运行测试
```

## 端口配置

- **前端**: 3000 (Vite)
- **后端**: 3001 (Gin)

如需修改端口：
- 前端：修改 `frontend-vue3-vite/vite.config.ts` 中的 `server.port`
- 后端：修改 `backend-go/config/config.yaml` 中的 `server.port`

## 环境配置

### 后端配置

**配置文件** `backend-go/config/config.yaml`:

```yaml
server:
  port: 3001
  mode: development  # development | production

database:
  driver: mysql      # mysql | postgres | sqlite
  host: localhost
  port: 3306
  name: ims_db
  user: root
  password: your_password

jwt:
  secret: your-secret-key
  expiration: 24h

admin:
  default_username: admin
  default_password: admin123
```

**环境变量** (覆盖配置文件):

```bash
export IMS_SERVER_PORT=3001
export IMS_DATABASE_HOST=localhost
export IMS_DATABASE_PASSWORD=your_password
export IMS_JWT_SECRET=your-secret-key
```

### 前端配置

**环境变量** `frontend-vue3-vite/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 数据库

### 自动迁移

后端启动时会自动执行数据库迁移，创建所需的表结构。

### 手动迁移

```bash
cd backend-go
go run cmd/main.go
```

### 支持的驱动

- **MySQL** (推荐生产环境)
- **PostgreSQL**
- **SQLite** (推荐开发环境)

切换驱动：修改 `config.yaml` 中的 `database.driver`。

## 调试

### 查看日志

Node.js 启动脚本会自动在日志前添加服务标识：

```
[FRONTEND] VITE v5.0.0  ready
[BACKEND]  🚀 服务器启动成功
```

### 单独查看服务日志

建议分别启动服务以查看独立日志：

```bash
# 终端 1 - 前端
cd frontend-vue3-vite && npm run dev

# 终端 2 - 后端
cd backend-go && go run cmd/main.go
```

### 后端调试

使用 Delve 调试器：

```bash
# 安装 Delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 调试运行
dlv debug cmd/main.go
```

## 代码规范

### 前端

- 使用 TypeScript 严格模式
- 组件使用 Composition API
- 使用 ESLint 检查代码

### 后端

- 遵循 Go 代码规范 (gofmt, golint)
- 使用 `go fmt` 格式化代码
- 错误处理要明确

```bash
# 格式化 Go 代码
go fmt ./...

# 检查代码
golint ./...
```

## 默认账号

系统启动时会自动创建默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@example.com`

> ⚠️ 生产环境请务必修改默认密码！

## 常见问题

### 后端启动失败

1. 检查数据库连接配置
2. 确认数据库服务已启动
3. 检查端口 3001 是否被占用

### 前端无法连接后端

1. 检查 `VITE_API_BASE_URL` 配置
2. 确认后端服务已启动
3. 检查 CORS 配置

### Go 依赖下载失败

```bash
cd backend-go
go clean -modcache
go mod download
```
