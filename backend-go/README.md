# IMS Backend (Go)

使用 Go + Gin + GORM 重写的人员信息管理系统后端。

## 技术栈

- **Web框架**: Gin
- **ORM**: GORM
- **数据库**: MySQL / PostgreSQL / SQLite
- **认证**: JWT
- **日志**: Zap + Lumberjack
- **配置**: Viper

## 目录结构

```
backend-go/
├── cmd/                    # 应用程序入口
│   └── main.go            # 主程序
├── config/                # 配置
│   ├── config.go         # 配置加载
│   └── config.yaml       # 配置文件
├── internal/              # 内部代码
│   ├── handlers/         # HTTP处理器
│   ├── middleware/       # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由配置
│   └── services/         # 业务逻辑层
├── pkg/                   # 公共包
│   ├── logger/           # 日志
│   └── utils/            # 工具函数
├── go.mod                # Go模块
└── README.md             # 说明文档
```

## 快速开始

### 1. 安装依赖

```bash
cd backend-go
go mod download
```

### 2. 配置环境

编辑 `config/config.yaml` 或使用环境变量：

```yaml
server:
  port: 3001
  mode: development

database:
  driver: mysql      # mysql | postgres | sqlite
  host: localhost
  port: 3306
  name: ims_db
  user: root
  password: your_password
```

### 3. 运行

```bash
# 开发模式
go run cmd/main.go

# 或编译运行
go build -o ims-server cmd/main.go
./ims-server
```

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户
- `GET /api/auth/profile` - 获取个人资料
- `POST /api/auth/change-password` - 修改密码

### 用户管理（管理员）
- `GET /api/users` - 用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/:id` - 获取用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `PATCH /api/users/:id/toggle` - 切换用户状态
- `GET /api/users/stats` - 用户统计

### 个人资料
- `GET /api/profile` - 获取我的信息
- `PUT /api/profile` - 更新我的信息

### 仪表盘
- `GET /api/dashboard/stats` - 获取仪表盘统计

### 联系人
- `GET /api/contacts` - 获取所有联系人

### 健康检查
- `GET /api/health` - 健康检查

## 环境变量

```bash
IMS_SERVER_PORT=3001
IMS_DATABASE_HOST=localhost
IMS_DATABASE_PORT=3306
IMS_DATABASE_NAME=ims_db
IMS_DATABASE_USER=root
IMS_DATABASE_PASSWORD=your_password
IMS_JWT_SECRET=your-secret-key
IMS_ADMIN_DEFAULT_USERNAME=admin
IMS_ADMIN_DEFAULT_PASSWORD=admin123
```

## 特性

- ✅ RESTful API 设计
- ✅ JWT 认证与授权
- ✅ 角色权限控制
- ✅ 请求限流保护
- ✅ 结构化日志记录
- ✅ 统一响应格式
- ✅ 请求追踪（Request ID）
- ✅ 优雅关闭
- ✅ 自动数据库迁移
- ✅ 默认管理员创建
- ✅ 多数据库支持（MySQL/PostgreSQL/SQLite）
