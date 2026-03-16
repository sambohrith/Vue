# 信息管理系统开发服务器启动脚本 (PowerShell)
# 同时启动前端(Vue3)和后端(Go)服务

param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
使用方法:
  .\start-dev.ps1                启动前后端服务
  .\start-dev.ps1 -SkipBackend   仅启动前端
  .\start-dev.ps1 -SkipFrontend  仅启动后端
  .\start-dev.ps1 -Help          显示帮助

服务地址:
  前端: http://localhost:3000
  后端: http://localhost:3001

技术栈:
  前端: Vue3 + Vite
  后端: Go + Gin
"@
    exit
}

$frontendJob = $null
$backendJob = $null

function Start-Frontend {
    Write-Host "🚀 正在启动前端服务 (Vue3)..." -ForegroundColor Cyan
    
    # 检查依赖
    if (-not (Test-Path "frontend-vue3-vite\node_modules")) {
        Write-Host "⚠️  前端依赖未安装，正在安装..." -ForegroundColor Yellow
        Set-Location frontend-vue3-vite
        npm install
        Set-Location ..
    }
    
    $job = Start-Job -ScriptBlock {
        Set-Location frontend-vue3-vite
        npm run dev 2>&1 | ForEach-Object { "[FRONTEND] $_" }
    }
    return $job
}

function Start-Backend {
    Write-Host "🚀 正在启动后端服务 (Go)..." -ForegroundColor Green
    
    # 检查 Go 环境
    $goVersion = go version 2>$null
    if (-not $goVersion) {
        Write-Host "❌ 未检测到 Go 环境，请先安装 Go 1.21+" -ForegroundColor Red
        exit 1
    }
    
    # 检查依赖
    if (-not (Test-Path "backend-go\go.mod")) {
        Write-Host "❌ 后端 go.mod 不存在，请确保 backend-go 目录存在" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📦 检查 Go 依赖..." -ForegroundColor Yellow
    Set-Location backend-go
    go mod download 2>&1 | Out-Null
    Set-Location ..
    
    $job = Start-Job -ScriptBlock {
        Set-Location backend-go
        go run cmd/main.go 2>&1 | ForEach-Object { "[BACKEND] $_" }
    }
    return $job
}

function Stop-Servers {
    Write-Host "`n🛑 正在停止所有服务..." -ForegroundColor Yellow
    if ($frontendJob) { Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue }
    if ($backendJob) { Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue }
    Write-Host "✅ 所有服务已停止" -ForegroundColor Green
}

# 捕获退出信号
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-Servers }

try {
    Write-Host @"
========================================
   信息管理系统 (IMS) - 开发服务器
   前端: Vue3 + Vite
   后端: Go + Gin
========================================
"@ -ForegroundColor Blue

    if (-not $SkipFrontend) {
        $frontendJob = Start-Frontend
        Start-Sleep -Seconds 2
    }

    if (-not $SkipBackend) {
        $backendJob = Start-Backend
        Start-Sleep -Seconds 2
    }

    Write-Host @"
========================================
✅ 开发服务器已启动!

📱 前端地址: http://localhost:3000
🖥️  后端地址: http://localhost:3001

默认管理员账号:
  用户名: admin
  密码: admin123

按 Ctrl+C 停止所有服务
========================================
"@ -ForegroundColor Green

    # 持续显示日志
    while ($true) {
        if ($frontendJob) { Receive-Job $frontendJob }
        if ($backendJob) { Receive-Job $backendJob }
        Start-Sleep -Milliseconds 100
    }
}
finally {
    Stop-Servers
}
