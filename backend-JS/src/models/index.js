const { sequelize, syncDatabase, Sequelize } = require('./database');
const User = require('./user');
const { ChatMessage, Room, RoomMember, RoomMessage } = require('./chat');
const { Post, PostLike, PostComment, SystemSettings } = require('./social');
const config = require('../config');
const { logger } = require('../utils/logger');

// 定义模型关联关系
const setupAssociations = () => {
  // User 关联
  User.hasMany(ChatMessage, { as: 'SentMessages', foreignKey: 'senderId' });
  User.hasMany(ChatMessage, { as: 'ReceivedMessages', foreignKey: 'receiverId' });
  User.hasMany(Room, { as: 'OwnedRooms', foreignKey: 'ownerId' });
  User.hasMany(RoomMember, { foreignKey: 'userId' });
  User.hasMany(RoomMessage, { foreignKey: 'senderId' });
  User.hasMany(Post, { foreignKey: 'userId' });
  User.hasMany(PostLike, { foreignKey: 'userId' });
  User.hasMany(PostComment, { foreignKey: 'userId' });

  // ChatMessage 关联
  ChatMessage.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
  ChatMessage.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

  // Room 关联
  Room.belongsTo(User, { as: 'Owner', foreignKey: 'ownerId' });
  Room.hasMany(RoomMember, { foreignKey: 'roomId' });
  Room.hasMany(RoomMessage, { foreignKey: 'roomId' });

  // RoomMember 关联
  RoomMember.belongsTo(Room, { foreignKey: 'roomId' });
  RoomMember.belongsTo(User, { foreignKey: 'userId' });

  // RoomMessage 关联
  RoomMessage.belongsTo(Room, { foreignKey: 'roomId' });
  RoomMessage.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });

  // Post 关联
  Post.belongsTo(User, { as: 'Author', foreignKey: 'userId' });
  Post.hasMany(PostLike, { foreignKey: 'postId' });
  Post.hasMany(PostComment, { foreignKey: 'postId' });

  // PostLike 关联
  PostLike.belongsTo(Post, { foreignKey: 'postId' });
  PostLike.belongsTo(User, { foreignKey: 'userId' });

  // PostComment 关联
  PostComment.belongsTo(Post, { foreignKey: 'postId' });
  PostComment.belongsTo(User, { as: 'Author', foreignKey: 'userId' });
  PostComment.belongsTo(PostComment, { as: 'Parent', foreignKey: 'parentId' });
};

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
  setupAssociations();
  await syncDatabase(false);
  await createDefaultAdmin();
};

module.exports = {
  sequelize,
  Sequelize,
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
