# C# 后端部署指南

## 支持的数据库

- **SQLite** (默认) - 本地开发，无需安装
- **MySQL** - 生产环境推荐
- **PostgreSQL** - 开源替代方案
- **SQL Server** - Windows 环境

## 快速切换数据库

### 方式1：修改配置文件

编辑 `appsettings.json`：

```json
{
  "Database": {
    "Provider": "mysql",
    "MySQL": {
      "Host": "localhost",
      "Port": 3306,
      "Database": "ims",
      "User": "ims",
      "Password": "your_password",
      "SslMode": "None"
    }
  }
}
```

### 方式2：环境变量（推荐用于生产）

```bash
# 设置数据库类型
export DB_PROVIDER=mysql

# MySQL 配置
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=ims
export DB_USER=ims
export DB_PASSWORD=your_password
export DB_SSLMODE=None

# 或 SQLite
export DB_PROVIDER=sqlite
export DB_PATH=ims.db
```

## 宝塔面板部署

### 1. 安装 .NET 9.0 Runtime

```bash
wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install -y aspnetcore-runtime-9.0
```

### 2. 创建数据库（MySQL）

宝塔面板 -> 数据库 -> 添加数据库
- 数据库名：`ims`
- 用户名：`ims`
- 密码：设置安全密码
- 访问权限：localhost 或 %

### 3. 上传发布文件

```bash
# 在 Windows 上发布 Linux 版本
dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish

# 上传到宝塔
# /www/wwwroot/ims-api
```

### 4. 配置环境变量

创建 `/www/wwwroot/ims-api/.env`：

```bash
DB_PROVIDER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ims
DB_USER=ims
DB_PASSWORD=your_password
DB_SSLMODE=None
```

### 5. 执行数据库迁移

```bash
cd /www/wwwroot/ims-api

# 设置环境变量
export $(cat .env | xargs)

# 执行迁移
dotnet ef database update
```

### 6. Supervisor 守护进程

```ini
[program:ims-api]
command=dotnet /www/wwwroot/ims-api/IMS.dll --urls "http://0.0.0.0:3001"
directory=/www/wwwroot/ims-api
user=www
autostart=true
autorestart=true
stderr_logfile=/var/log/ims-api.err.log
stdout_logfile=/var/log/ims-api.out.log
environment=DB_PROVIDER="mysql",DB_HOST="localhost",DB_PORT="3306",DB_NAME="ims",DB_USER="ims",DB_PASSWORD="your_password"
```

### 7. Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Docker 部署

### Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 3001

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "IMS.dll"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DB_PROVIDER=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_NAME=ims
      - DB_USER=ims
      - DB_PASSWORD=your_password
    depends_on:
      - db
    networks:
      - ims-network

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=ims
      - MYSQL_USER=ims
      - MYSQL_PASSWORD=your_password
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - ims-network

volumes:
  mysql_data:

networks:
  ims-network:
    driver: bridge
```

## 数据库配置示例

### MySQL

```json
{
  "Database": {
    "Provider": "mysql",
    "MySQL": {
      "Host": "localhost",
      "Port": 3306,
      "Database": "ims",
      "User": "ims",
      "Password": "your_password",
      "SslMode": "None"
    }
  }
}
```

### PostgreSQL

```json
{
  "Database": {
    "Provider": "postgresql",
    "PostgreSQL": {
      "Host": "localhost",
      "Port": 5432,
      "Database": "ims",
      "User": "postgres",
      "Password": "your_password"
    }
  }
}
```

### SQL Server

```json
{
  "Database": {
    "Provider": "sqlserver",
    "SQLServer": {
      "Host": "localhost",
      "Database": "ims",
      "User": "sa",
      "Password": "your_password",
      "TrustServerCertificate": true
    }
  }
}
```

### SQLite

```json
{
  "Database": {
    "Provider": "sqlite",
    "SQLite": {
      "Path": "ims.db"
    }
  }
}
```

## 安全建议

1. **JWT Secret**: 生产环境务必修改
2. **数据库密码**: 使用强密码
3. **默认账号**: 首次登录后修改 admin 密码
4. **HTTPS**: 生产环境启用 HTTPS
5. **防火墙**: 仅开放必要端口

## 故障排查

### 数据库连接失败

```bash
# 检查环境变量
echo $DB_PROVIDER
echo $DB_HOST

# 测试 MySQL 连接
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
```

### 迁移失败

```bash
# 删除迁移重新创建
dotnet ef migrations remove
dotnet ef migrations add InitialCreate

# 或手动删除数据库后重建
dotnet ef database drop -f
dotnet ef database update
```

### 端口占用

```bash
# 查看端口占用
netstat -tlnp | grep 3001

# 杀死进程
kill -9 <PID>
```
