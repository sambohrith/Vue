const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { logger } = require('../utils/logger');

// 立即初始化 Sequelize 实例
const dbConfig = config.database;
let sequelize;

if (dbConfig.driver === 'sqlite') {
  const dataDir = path.dirname(config.sqlite.path);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.sqlite.path,
    logging: config.server.mode === 'development' ? msg => logger.debug(msg) : false
  });
} else {
  sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.driver,
    logging: config.server.mode === 'development' ? msg => logger.debug(msg) : false,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
      underscored: false,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    }
  });
}

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info(`数据库连接成功 [${dbConfig.driver}]`);
    return sequelize;
  } catch (error) {
    logger.error('数据库连接失败:', error);
    throw error;
  }
};

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: false });
    logger.info('数据库同步完成');
  } catch (error) {
    logger.error('数据库同步失败:', error);
    throw error;
  }
};

const closeDatabase = async () => {
  if (sequelize) {
    await sequelize.close();
    logger.info('数据库连接已关闭');
  }
};

module.exports = {
  sequelize,
  initDatabase,
  syncDatabase,
  closeDatabase,
  Sequelize
};
