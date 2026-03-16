require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const os = require('os');

const { connectDB, syncModels, sequelize } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const security = require('./middleware/security');
const logger = require('./middleware/logger');
const { cacheMiddleware } = require('./middleware/cache');
const { Op } = require('sequelize');

const routes = require('./routes');

const ChatMessage = require('./modules/chat/models/ChatMessage');
const User = require('./modules/user/models/User');

async function createDefaultAdmin() {
  try {
    const adminUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@example.com';
    
    const existingAdmin = await User.findOne({
      where: { username: adminUsername }
    });
    
    if (existingAdmin) {
      console.log('✅ 管理员账号已存在');
      return;
    }
    
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

async function autoFixChatMessages() {
  try {
    console.log('检查聊天消息数据...');
    
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
  } catch (error) {
    console.error('❌ 自动修复消息数据失败:', error.message);
  }
}

function detectEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  
  const networkInterfaces = os.networkInterfaces();
  let localIP = '127.0.0.1';
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== '127.0.0.1') break;
  }
  
  const publicIP = process.env.SERVER_PUBLIC_IP || localIP;
  const port = process.env.PORT || 3001;
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

const env = detectEnvironment();

console.log('=================================');
console.log(`🔧 运行环境: ${env.nodeEnv}`);
console.log(`🌐 本地IP: ${env.localIP}`);
console.log(`🌍 公网IP: ${env.publicIP}`);
console.log(`🔗 访问域名: ${env.domain}`);
console.log(`🏠 本地服务器: ${env.isLocalServer ? '是' : '否'}`);
console.log('=================================');

const app = express();

app.set('trust proxy', 1);

const getCorsOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',');
  }
  
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

app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));

app.use(logger.http);

app.use(express.json({ limit: security.requestSizeLimit.json }));
app.use(express.urlencoded({ extended: true, limit: security.requestSizeLimit.urlencoded }));

app.use(security.xss);
app.use(security.hpp);

app.use(compression());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/health', cacheMiddleware(60), (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api', routes);

app.use(notFoundHandler);

app.use(errorHandler);

async function startServer() {
  try {
    console.log('正在连接数据库...');
    await connectDB();
    console.log('数据库连接成功');
    console.log('正在同步数据库模型...');
    await syncModels();
    console.log('数据库模型同步成功');
    
    await autoFixChatMessages();
    await createDefaultAdmin();
    
    const PORT = env.port;
    const HOST = env.isLocalServer ? '0.0.0.0' : env.localIP;
    
    const server = app.listen(PORT, HOST, () => {
      console.log('=================================');
      console.log(`🚀 服务器启动成功！`);
      console.log('=================================');
      
      console.log(`📍 本地访问地址:`);
      console.log(`   • http://localhost:${PORT}`);
      console.log(`   • http://127.0.0.1:${PORT}`);
      
      if (env.isLocalServer) {
        console.log(`\n🌐 局域网访问地址:`);
        console.log(`   • http://${env.localIP}:${PORT}`);
      }
      
      if (!env.isLocalServer) {
        console.log(`\n🌍 公网访问地址:`);
        console.log(`   • http://${env.publicIP}:${PORT}`);
      }
      
      console.log(`\n📊 API 地址:`);
      console.log(`   • http://localhost:${PORT}/api`);
      console.log(`   • http://localhost:${PORT}/api/health`);
      console.log('=================================');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请检查是否有其他服务正在运行`);
      } else {
        console.error('❌ 服务器启动失败:', error);
      }
      process.exit(1);
    });

    process.on('SIGTERM', async () => {
      console.log('\n正在关闭服务器...');
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('✅ 数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          console.error('❌ 关闭数据库连接失败:', error);
          process.exit(1);
        }
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n正在关闭服务器...');
      server.close(async () => {
        try {
          await sequelize.close();
          console.log('✅ 数据库连接已关闭');
          process.exit(0);
        } catch (error) {
          console.error('❌ 关闭数据库连接失败:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
