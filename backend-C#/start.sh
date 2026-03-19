#!/bin/bash
# IMS C# 后端启动脚本

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 显示配置
echo "======================================"
echo "IMS C# 后端启动"
echo "======================================"
echo "数据库类型: ${DB_PROVIDER:-sqlite}"
echo "服务器端口: ${SERVER_PORT:-3001}"
echo "运行模式: ${SERVER_MODE:-development}"
echo "======================================"

# 启动服务
dotnet IMS.dll --urls "http://0.0.0.0:${SERVER_PORT:-3001}"
