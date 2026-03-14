/**
 * 人员信息管理系统 - 主应用文件
 * 包含：安全中间件、路由配置、错误处理、性能优化
 * 支持：本地开发环境和在线服务器环境
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const os = require('os');

const { connectDB, syncModels, sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const security = require('./middleware/security');
const { Op } = require('sequelize');

// 导入路由
const routes = require('./routes');

// 导入模型
const ChatMessage = require('./modules/chat/models/ChatMessage');
const User = require('./modules/user/models/User');

// 创建默认管理员账号
async function createDefaultAdmin() {
  try {
    const adminUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@example.com';
    
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({
      where: { username: adminUsername }
    });
    
    if (existingAdmin) {
      console.log('✅ 管理员账号已存在');
      return;
    }
    
    // 创建管理员账号
    await User.create({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
      fullName: '系统管理员'
    });
    
    console.log('✅ 默认管理员账号创建成功');
    console.log(`   用户名: ${adminUsername}`);
    console.log(`   密码: ${adminPassword}`);
  } catch (error) {
    console.error('❌ 创建默认管理员账号失败:', error.message);
  }
}

// 自动修复聊天消息数据
async function autoFixChatMessages() {
  try {
    console.log('检查聊天消息数据...');
    
    // 查询有问题的消息数量
    const badMessageCount = await ChatMessage.count({
      where: {
        [Op.or]: [
          { senderId: 0 },
          { receiverId: 0 }
        ]
      }
    });
    
    if (badMessageCount === 0) {
      console.log('✅ 聊天消息数据正常');
      return;
    }
    
    console.log(`发现 ${badMessageCount} 条无效消息，正在修复...`);
    
    // 获取前两个用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'fullName'],
      order: [['id', 'ASC']],
      limit: 2
    });
    
    if (users.length < 2) {
      console.log('⚠️ 系统中用户数量不足，无法修复消息数据');
      return;
    }
    
    const senderId = users[0].id;
    const receiverId = users[1].id;
    
    // 更新有问题的消息
    const [updatedCount] = await ChatMessage.update(
      { senderId, receiverId },
      {
        where: {
          [Op.or]: [
            { senderId: 0 },
            { receiverId: 0 }
          ]
        }
      }
    );
    
    console.log(`✅ 成功修复 ${updatedCount} 条消息`);
    console.log(`   发送者: ${users[0].fullName || users[0].username} (ID: ${senderId})`);
    console.log(`   接收者: ${users[1].fullName || users[1].username} (ID: ${receiverId})`);
  } catch (error) {
    console.error('❌ 自动修复消息数据失败:', error.message);
  }
}

const app = express();

// ==================== 环境检测与配置 ====================

/**
 * 检测当前运行环境
 * @returns {Object} 环境信息
 */
function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  
  // 获取本机IP地址
  const networkInterfaces = os.networkInterfaces();
  let localIP = '127.0.0.1';
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      // 获取IPv4地址，排除内部地址
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== '127.0.0.1') break;
  }
  
  // 服务器公网IP（从环境变量获取，如果没有则使用本地IP）
  const publicIP = process.env.SERVER_PUBLIC_IP || localIP;
  
  // 端口配置
  const port = process.env.PORT || 3001;
  
  // 域名配置
  const domain = process.env.SERVER_DOMAIN || (isProduction ? publicIP : `localhost:${port}`);
  
  return {
    nodeEnv,
    isProduction,
    isDevelopment,
    localIP,
    publicIP,
    port,
    domain,
    isLocalServer: localIP === '127.0.0.1' || localIP.startsWith('192.168.') || localIP.startsWith('10.')
  };
}

// 获取环境信息
const env = detectEnvironment();

// 打印环境信息
console.log('=================================');
console.log(`🔧 运行环境: ${env.nodeEnv}`);
console.log(`🌐 本地IP: ${env.localIP}`);
console.log(`🌍 公网IP: ${env.publicIP}`);
console.log(`🔗 访问域名: ${env.domain}`);
console.log(`🏠 本地服务器: ${env.isLocalServer ? '是' : '否'}`);
console.log('=================================');

// ==================== 安全中间件 ====================

// 信任代理（用于获取真实 IP）
app.set('trust proxy', 1);

// Helmet 安全头
app.use(security.helmet);

// CORS 配置 - 根据环境自动调整
const getCorsOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',');
  }
  
  // 本地开发环境
  if (env.isDevelopment) {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      `http://${env.localIP}:3000`,
      `http://${env.localIP}:3001`,
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
  }
  
  // 生产环境
  const origins = [];
  if (process.env.SERVER_DOMAIN) {
    origins.push(`http://${process.env.SERVER_DOMAIN}`);
    origins.push(`https://${process.env.SERVER_DOMAIN}`);
  }
  if (process.env.SERVER_PUBLIC_IP) {
    origins.push(`http://${process.env.SERVER_PUBLIC_IP}`);
    origins.push(`https://${process.env.SERVER_PUBLIC_IP}`);
  }
  
  return origins.length > 0 ? origins : ['http://localhost:3000'];
};

const corsOptions = {
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// 请求日志
app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));

// 请求体解析
app.use(express.json({ limit: security.requestSizeLimit.json }));
app.use(express.urlencoded({ extended: true, limit: security.requestSizeLimit.urlencoded }));

// 数据清理中间件
app.use(security.mongoSanitize);
app.use(security.xss);
app.use(security.hpp);

// 压缩响应
app.use(compression());

// ==================== 静态文件 ====================

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// ==================== API 路由 ====================

// API 路由
app.use('/api', routes);

// ==================== 错误处理 ====================

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的接口不存在'
  });
});

// 全局错误处理
app.use(errorHandler);

// ==================== 服务器启动 ====================

const startServer = async () => {
  try {
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');
    console.log('正在同步数据库模型...');
    await syncModels();
    console.log('数据库模型同步成功');
    
    // 自动修复无效的消息数据
    await autoFixChatMessages();
    
    // 创建默认管理员账号
    await createDefaultAdmin();
    
    const PORT = env.port;
    const HOST = env.isLocalServer ? '0.0.0.0' : env.localIP;
    
    const server = app.listen(PORT, HOST, () => {
      console.log('=================================');
      console.log(`🚀 服务器启动成功！`);
      console.log('=================================');
      
      // 本地访问地址
      console.log(`📍 本地访问地址:`);
      console.log(`   • http://localhost:${PORT}`);
      console.log(`   • http://127.0.0.1:${PORT}`);
      
      // 局域网访问地址（如果是本地服务器）
      if (env.isLocalServer && env.localIP !== '127.0.0.1') {
        console.log(`📍 局域网访问地址:`);
        console.log(`   • http://${env.localIP}:${PORT}`);
      }
      
      // 公网访问地址（如果是在线服务器）
      if (!env.isLocalServer || process.env.SERVER_PUBLIC_IP) {
        console.log(`📍 公网访问地址:`);
        console.log(`   • http://${env.publicIP}:${PORT}`);
        if (process.env.SERVER_DOMAIN) {
          console.log(`   • http://${process.env.SERVER_DOMAIN}`);
        }
      }
      
      console.log('=================================');
      console.log(`📁 API 地址: http://localhost:${PORT}/api`);
      console.log(`🔐 登录页面: http://localhost:${PORT}/html/auth/login.html`);
      console.log(`📝 注册页面: http://localhost:${PORT}/html/auth/register.html`);
      console.log(`🖥️  主页面: http://localhost:${PORT}/html/main/index.html`);
      console.log('=================================');
    });
    
    // 处理未捕获的异常
    process.on('unhandledRejection', (err) => {
      console.error('未处理的 Promise 拒绝:', err.message);
      console.error(err.stack);
      server.close(() => process.exit(1));
    });
    
    process.on('uncaughtException', (err) => {
      console.error('未捕获的异常:', err.message);
      console.error(err.stack);
      server.close(() => process.exit(1));
    });
    
    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('SIGTERM 信号收到，正在优雅关闭服务器...');
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// 导出应用实例（用于测试）
module.exports = { app, startServer, env };
