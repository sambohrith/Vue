@echo off
chcp 65001 >nul
title IMS 开发服务器

:: 信息管理系统开发服务器启动脚本 (Batch)
:: 同时启动前端(Vue3)和后端(Go)服务

set "FRONTEND_DIR=frontend-vue3-vite"
set "BACKEND_DIR=backend-go"

:: 解析参数
set "SKIP_BACKEND="
set "SKIP_FRONTEND="
set "SHOW_HELP="

:parse_args
if "%~1"=="" goto :check_args
if /i "%~1"=="-b" set "SKIP_FRONTEND=1"
if /i "%~1"=="--backend-only" set "SKIP_FRONTEND=1"
if /i "%~1"=="-f" set "SKIP_BACKEND=1"
if /i "%~1"=="--frontend-only" set "SKIP_FRONTEND=1"
if /i "%~1"=="-h" set "SHOW_HELP=1"
if /i "%~1"=="--help" set "SHOW_HELP=1"
shift
goto :parse_args

:check_args
if defined SHOW_HELP (
    echo 使用方法:
    echo   start-dev.bat                启动前后端服务
    echo   start-dev.bat -f             仅启动前端
    echo   start-dev.bat -b             仅启动后端
    echo   start-dev.bat -h             显示帮助
    echo.
    echo 服务地址:
    echo   前端: http://localhost:3000
    echo   后端: http://localhost:3001
    echo.
    echo 技术栈:
    echo   前端: Vue3 + Vite
    echo   后端: Go + Gin
    exit /b 0
)

echo.
echo ========================================
echo    信息管理系统 (IMS) - 开发服务器
echo    前端: Vue3 + Vite
echo    后端: Go + Ginecho ========================================
echo.

:: 启动前端
if not defined SKIP_FRONTEND (
    echo [启动] 前端服务 (Vue3)...
    
    if not exist "%FRONTEND_DIR%\node_modules" (
        echo [安装] 前端依赖...
        cd %FRONTEND_DIR%
        call npm install
        cd ..
    )
    
    start "Frontend - Vue3" cmd /k "cd %FRONTEND_DIR% && npm run dev"
    timeout /t 2 /nobreak >nul
)

:: 启动后端
if not defined SKIP_BACKEND (
    echo [启动] 后端服务 (Go)...
    
    :: 检查 Go 环境
    go version >nul 2>&1
    if errorlevel 1 (
        echo [错误] 未检测到 Go 环境，请先安装 Go 1.21+
        exit /b 1
    )
    
    :: 检查 go.mod
    if not exist "%BACKEND_DIR%\go.mod" (
        echo [错误] 后端 go.mod 不存在，请确保 %BACKEND_DIR% 目录存在
        exit /b 1
    )
    
    echo [检查] Go 依赖...
    cd %BACKEND_DIR%
    go mod download >nul 2>&1
    cd ..
    
    start "Backend - Go" cmd /k "cd %BACKEND_DIR% && go run cmd/main.go"
    timeout /t 2 /nobreak >nul
)

echo.
echo ========================================
echo [OK] 开发服务器已启动!
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 默认管理员账号:
echo   用户名: admin
echo   密码: admin123
echo.
echo 按任意键停止所有服务...
echo ========================================
echo.

pause >nul

:: 停止服务
echo [停止] 正在关闭服务...
taskkill /FI "WINDOWTITLE eq Frontend - Vue3*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend - Go*" /F >nul 2>&1

echo [OK] 所有服务已停止
timeout /t 1 /nobreak >nul
