require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const { initDatabase, closeDatabase } = require('./models/database');
const { initModels } = require('./models');
const { httpLogger, logger } = require('./utils/logger');
const { errorHandler, notFound, recovery, createRateLimiter, requestId } = require('./middleware');
const routes = require('./routes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.server.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'X-Request-ID']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestId);
app.use(httpLogger);

if (config.server.mode === 'development') {
  app.use(morgan('dev'));
}

app.use(createRateLimiter());

app.use('/api', routes);

app.use(notFound);
app.use(recovery);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initDatabase();
    await initModels();

    const server = app.listen(config.server.port, () => {
      logger.info(`服务器启动成功 [${config.server.mode}]`);
      console.log(`
=================================
🚀 服务器启动成功！
=================================
📍 本地访问地址:
   • http://localhost:${config.server.port}
   • http://127.0.0.1:${config.server.port}

📊 API 地址:
   • http://localhost:${config.server.port}/api
   • http://localhost:${config.server.port}/api/health
=================================
      `);
    });

    const gracefulShutdown = async () => {
      logger.info('正在关闭服务器...');
      
      server.close(async () => {
        await closeDatabase();
        logger.info('服务器已关闭');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的 Promise 拒绝:', reason);
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
