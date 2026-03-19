const { sequelize, syncDatabase } = require('./database');
const User = require('./user');
const { ChatMessage, Room, RoomMember, RoomMessage } = require('./chat');
const { Post, PostLike, PostComment, SystemSettings } = require('./social');
const config = require('../config');
const { logger } = require('../utils/logger');

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({
      where: { username: config.admin.defaultUsername }
    });

    if (existingAdmin) {
      logger.info('管理员账号已存在');
      return;
    }

    await User.create({
      username: config.admin.defaultUsername,
      email: config.admin.defaultEmail,
      password: config.admin.defaultPassword,
      fullName: '系统管理员',
      role: 'admin',
      isActive: true
    });

    logger.info(`默认管理员账号创建成功: ${config.admin.defaultUsername}`);
  } catch (error) {
    logger.error('创建默认管理员失败:', error);
  }
};

const initModels = async () => {
  await syncDatabase(false);
  await createDefaultAdmin();
};

module.exports = {
  sequelize,
  User,
  ChatMessage,
  Room,
  RoomMember,
  RoomMessage,
  Post,
  PostLike,
  PostComment,
  SystemSettings,
  initModels
};
