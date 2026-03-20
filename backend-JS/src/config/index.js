const dotenv = require('dotenv');
const path = require('path');

// 根据 NODE_ENV 加载对应的环境配置文件
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

// 作为后备，加载默认的 .env 文件
dotenv.config();

module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 3001,
    mode: process.env.NODE_ENV || 'development',
    allowedOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',')
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiration: process.env.JWT_EXPIRATION || '24h'
  },
  database: {
    driver: process.env.DB_DRIVER || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'ims',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 100,
      min: parseInt(process.env.DB_POOL_MIN) || 10,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    }
  },
  sqlite: {
    path: process.env.SQLITE_PATH || './data/ims.db'
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    filename: process.env.LOG_FILENAME || './logs/app.log',
    maxSize: parseInt(process.env.LOG_MAX_SIZE) || 100,
    maxBackups: parseInt(process.env.LOG_MAX_BACKUPS) || 30,
    maxAge: parseInt(process.env.LOG_MAX_AGE) || 30
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 60,
    burst: parseInt(process.env.RATE_LIMIT_BURST) || 10
  },
  admin: {
    defaultUsername: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
    defaultEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@example.com'
  }
};
