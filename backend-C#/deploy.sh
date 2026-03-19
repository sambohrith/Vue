#!/bin/bash
# C# 后端通用部署脚本

set -e

echo "=== IMS C# 后端部署脚本 ==="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
DEPLOY_DIR="${DEPLOY_DIR:-/www/wwwroot/ims-api}"
DB_PROVIDER="${DB_PROVIDER:-sqlite}"

# 检查 .NET
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}.NET 运行时未安装${NC}"
    echo "请安装 .NET 9.0:"
    echo "  wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb"
    echo "  sudo dpkg -i packages-microsoft-prod.deb"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y aspnetcore-runtime-9.0"
    exit 1
fi

echo -e "${BLUE}.NET 版本: $(dotnet --version)${NC}"

# 创建部署目录
echo -e "${YELLOW}1. 创建部署目录...${NC}"
mkdir -p $DEPLOY_DIR

# 复制文件
echo -e "${YELLOW}2. 复制发布文件...${NC}"
if [ -d "publish" ]; then
    cp -r publish/* $DEPLOY_DIR/
else
    echo -e "${RED}错误: publish 目录不存在，请先执行 dotnet publish${NC}"
    exit 1
fi

# 根据数据库类型配置
 case $DB_PROVIDER in
    mysql)
        echo -e "${YELLOW}3. 配置 MySQL 数据库...${NC}"
        cat > $DEPLOY_DIR/.env <<EOF
DB_PROVIDER=mysql
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-ims}
DB_USER=${DB_USER:-ims}
DB_PASSWORD=${DB_PASSWORD:-}
DB_SSLMODE=${DB_SSLMODE:-None}
EOF
        ;;
    postgresql|postgres)
        echo -e "${YELLOW}3. 配置 PostgreSQL 数据库...${NC}"
        cat > $DEPLOY_DIR/.env <<EOF
DB_PROVIDER=postgresql
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-ims}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}
EOF
        ;;
    sqlserver)
        echo -e "${YELLOW}3. 配置 SQL Server 数据库...${NC}"
        cat > $DEPLOY_DIR/.env <<EOF
DB_PROVIDER=sqlserver
DB_HOST=${DB_HOST:-localhost}
DB_NAME=${DB_NAME:-ims}
DB_USER=${DB_USER:-sa}
DB_PASSWORD=${DB_PASSWORD:-}
EOF
        ;;
    sqlite|*)
        echo -e "${YELLOW}3. 配置 SQLite 数据库...${NC}"
        cat > $DEPLOY_DIR/.env <<EOF
DB_PROVIDER=sqlite
DB_PATH=${DB_PATH:-ims.db}
EOF
        ;;
esac

# 设置权限
echo -e "${YELLOW}4. 设置权限...${NC}"
chown -R www:www $DEPLOY_DIR 2>/dev/null || chown -R $(whoami):$(whoami) $DEPLOY_DIR
chmod +x $DEPLOY_DIR/IMS 2>/dev/null || true

# 执行数据库迁移
echo -e "${YELLOW}5. 执行数据库迁移...${NC}"
cd $DEPLOY_DIR
export $(cat .env | xargs) 2>/dev/null || true

# 安装 dotnet-ef（如果未安装）
if ! command -v dotnet-ef &> /dev/null; then
    echo -e "${BLUE}安装 dotnet-ef 工具...${NC}"
    dotnet tool install --global dotnet-ef 2>/dev/null || true
    export PATH="$PATH:$HOME/.dotnet/tools"
fi

# 执行迁移
dotnet ef database update --context ApplicationDbContext 2>/dev/null || echo -e "${YELLOW}迁移跳过（可能已是最新）${NC}"

echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo -e "部署目录: ${BLUE}$DEPLOY_DIR${NC}"
echo -e "数据库: ${BLUE}$DB_PROVIDER${NC}"
echo ""
echo "启动命令:"
echo -e "  ${BLUE}cd $DEPLOY_DIR && dotnet IMS.dll --urls 'http://0.0.0.0:3001'${NC}"
echo ""
echo "或配置 Supervisor 守护进程:"
echo -e "  ${BLUE}supervisorctl start ims-api${NC}"
