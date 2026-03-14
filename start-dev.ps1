# 信息管理系统开发服务器启动脚本
# 同时启动前端和后端服务

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
使用方法:
  .\start-dev.ps1         启动前后端服务
  .\start-dev.ps1 -SkipBackend    仅启动前端
  .\start-dev.ps1 -SkipFrontend   仅启动后端
  .\start-dev.ps1 -Help           显示帮助

服务地址:
  前端: http://localhost:3000
  后端: http://localhost:3001
"@
    exit
}

$frontendJob = $null
$backendJob = $null

function Start-Frontend {
    Write-Host "🚀 正在启动前端服务..." -ForegroundColor Cyan
    $job = Start-Job -ScriptBlock {
        Set-Location frontend
        npm run dev 2>&1 | ForEach-Object { "[FRONTEND] $_" }
    }
    return $job
}

function Start-Backend {
    Write-Host "🚀 正在启动后端服务..." -ForegroundColor Green
    $job = Start-Job -ScriptBlock {
        Set-Location backend
        npm run dev 2>&1 | ForEach-Object { "[BACKEND] $_" }
    }
    return $job
}

function Stop-Servers {
    Write-Host "`n🛑 正在停止所有服务..." -ForegroundColor Yellow
    if ($frontendJob) { Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue }
    if ($backendJob) { Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue }
    Write-Host "✅ 所有服务已停止" -ForegroundColor Green
    exit
}

# 注册退出事件
trap { Stop-Servers }

# 显示欢迎信息
Write-Host @"
========================================
   信息管理系统 (IMS) - 开发服务器
========================================
"@ -ForegroundColor Blue

# 检查依赖
if (-not $SkipFrontend -and -not (Test-Path "frontend\node_modules")) {
    Write-Host "⚠️  前端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

if (-not $SkipBackend -and -not (Test-Path "backend\node_modules")) {
    Write-Host "⚠️  后端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# 启动服务
if (-not $SkipFrontend) {
    $frontendJob = Start-Frontend
}

if (-not $SkipBackend) {
    $backendJob = Start-Backend
}

# 等待服务启动
Start-Sleep -Seconds 2

Write-Host @"

✅ 开发服务器已启动!

📱 前端地址: http://localhost:3000
🖥️  后端地址: http://localhost:3001

按 Ctrl+C 停止所有服务

========================================
日志输出:
"@ -ForegroundColor Green

# 实时显示日志
try {
    while ($true) {
        if ($frontendJob) {
            $frontendJob | Receive-Job | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }
        }
        if ($backendJob) {
            $backendJob | Receive-Job | ForEach-Object { Write-Host $_ -ForegroundColor Green }
        }
        Start-Sleep -Milliseconds 100
    }
} finally {
    Stop-Servers
}
