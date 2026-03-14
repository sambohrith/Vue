@echo off
chcp 65001 >nul
title IMS 开发服务器

:: 信息管理系统开发服务器启动脚本

echo ========================================
echo    信息管理系统 (IMS) - 开发服务器
echo ========================================
echo.

:: 解析参数
set "RUN_FRONTEND=1"
set "RUN_BACKEND=1"

if "%~1"=="-h" goto :help
if "%~1"=="--help" goto :help
if "%~1"=="/help" goto :help

if "%~1"=="--frontend-only" (
    set "RUN_BACKEND=0"
    goto :start
)
if "%~1"=="--backend-only" (
    set "RUN_FRONTEND=0"
    goto :start
)
if "%~1"=="-f" (
    set "RUN_BACKEND=0"
    goto :start
)
if "%~1"=="-b" (
    set "RUN_FRONTEND=0"
    goto :start
)

:start
:: 检查依赖
if "%RUN_FRONTEND%"=="1" (
    if not exist "frontend\node_modules" (
        echo ⚠️  前端依赖未安装，正在安装...
        cd frontend
        call npm install
        if errorlevel 1 (
            echo ❌ 前端依赖安装失败
            exit /b 1
        )
        cd ..
    )
)

if "%RUN_BACKEND%"=="1" (
    if not exist "backend\node_modules" (
        echo ⚠️  后端依赖未安装，正在安装...
        cd backend
        call npm install
        if errorlevel 1 (
            echo ❌ 后端依赖安装失败
            exit /b 1
        )
        cd ..
    )
)

:: 启动服务
echo.
if "%RUN_FRONTEND%"=="1" (
    echo 🚀 正在启动前端服务...
    start "IMS Frontend" cmd /k "cd frontend && echo [FRONTEND] 启动中... && npm run dev"
    timeout /t 2 /nobreak >nul
)

if "%RUN_BACKEND%"=="1" (
    echo 🚀 正在启动后端服务...
    start "IMS Backend" cmd /k "cd backend && echo [BACKEND] 启动中... && npm run dev"
    timeout /t 2 /nobreak >nul
)

echo.
echo ========================================
echo ✅ 开发服务器已启动!
echo.
echo 📱 前端地址: http://localhost:3000
echo 🖥️  后端地址: http://localhost:3001
echo ========================================
echo.
echo 提示: 关闭此窗口不会影响已启动的服务
echo       单独关闭前端或后端请关闭对应窗口
echo.
pause
goto :eof

:help
echo 使用方法:
echo   start-dev.bat         启动前后端服务
echo   start-dev.bat -f      仅启动前端
echo   start-dev.bat -b      仅启动后端
echo   start-dev.bat --frontend-only   仅启动前端
echo   start-dev.bat --backend-only    仅启动后端
echo   start-dev.bat -h      显示帮助
echo.
echo 服务地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:3001
echo.
pause
