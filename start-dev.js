#!/usr/bin/env node
/**
 * 信息管理系统开发服务器启动脚本
 * 同时启动前端(Vue3)和后端(Go)服务
 */

import { spawn } from 'child_process';
import path from 'path';
import readline from 'readline';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);
const timestamp = () => new Date().toLocaleTimeString('zh-CN', { hour12: false });

const args = process.argv.slice(2);
const skipBackend = args.includes('--backend-only') || args.includes('-b');
const skipFrontend = args.includes('--frontend-only') || args.includes('-f');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  log(`
使用方法:
  node start-dev.js         启动前后端服务
  node start-dev.js -f      仅启动前端
  node start-dev.js -b      仅启动后端
  node start-dev.js -h      显示帮助

服务地址:
  前端: http://localhost:3000
  后端: http://localhost:3001
`, 'cyan');
  process.exit(0);
}

const processes = [];

function createService(name, cwd, command, color) {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'cmd' : 'sh';
  const args = isWindows ? ['/c', command] : ['-c', command];
  
  const proc = spawn(cmd, args, {
    cwd: path.resolve(__dirname, cwd),
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  const prefix = `[${name.toUpperCase()}]`;
  
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        log(`${timestamp()} ${colors[color]}${prefix}${colors.reset} ${line}`, color);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        log(`${timestamp()} ${colors.red}${prefix}${colors.reset} ${line}`, 'red');
      }
    });
  });

  proc.on('close', (code) => {
    log(`${timestamp()} ${colors.yellow}${prefix} 进程已退出 (code: ${code})${colors.reset}`, 'yellow');
  });

  return proc;
}

function stopAll() {
  log('\n🛑 正在停止所有服务...', 'yellow');
  processes.forEach(proc => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
      } else {
        proc.kill('SIGTERM');
      }
    } catch (e) {
      // ignore
    }
  });
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
process.on('exit', stopAll);

async function main() {
  log(`
========================================
   信息管理系统 (IMS) - 开发服务器
   前端: Vue3 + Vite
   后端: Go + Gin
========================================
`, 'blue');

  // 前端依赖检查
  if (!skipFrontend && !fs.existsSync('frontend-vue3-vite/node_modules')) {
    log('⚠️  前端依赖未安装，正在安装...', 'yellow');
    const install = spawn('npm', ['install'], { cwd: 'frontend-vue3-vite', stdio: 'inherit' });
    await new Promise((resolve) => install.on('close', resolve));
  }

  // Go 依赖检查
  if (!skipBackend) {
    const goModPath = path.join(__dirname, 'backend-go', 'go.mod');
    if (!fs.existsSync(goModPath)) {
      log('❌ 后端 go.mod 不存在，请确保 backend-go 目录存在', 'red');
      process.exit(1);
    }
    
    // 检查是否需要下载依赖
    const vendorPath = path.join(__dirname, 'backend-go', 'vendor');
    if (!fs.existsSync(vendorPath)) {
      log('📦 正在检查 Go 依赖...', 'yellow');
      const download = spawn('go', ['mod', 'download'], { 
        cwd: 'backend-go', 
        stdio: 'inherit',
        shell: true 
      });
      await new Promise((resolve) => download.on('close', resolve));
    }
  }

  if (!skipFrontend) {
    log('🚀 正在启动前端服务...', 'cyan');
    processes.push(createService('frontend', 'frontend-vue3-vite', 'npm run dev', 'cyan'));
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!skipBackend) {
    log('🚀 正在启动后端服务 (Go)...', 'green');
    processes.push(createService('backend', 'backend-go', 'go run cmd/main.go', 'green'));
    await new Promise(r => setTimeout(r, 2000));
  }

  log(`
========================================
✅ 开发服务器已启动!

📱 前端地址: http://localhost:3000
🖥️  后端地址: http://localhost:3001

默认管理员账号:
  用户名: admin
  密码: admin123

按 Ctrl+C 停止所有服务
========================================
`, 'green');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', stopAll);
  rl.on('close', stopAll);
}

main().catch(err => {
  log(`错误: ${err.message}`, 'red');
  process.exit(1);
});
