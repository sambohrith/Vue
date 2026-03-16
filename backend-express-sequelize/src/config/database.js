const { Sequelize } = require('sequelize');

const DB_DIALECT = process.env.DB_DIALECT || 'mysql';
const NODE_ENV = process.env.NODE_ENV || 'development';

const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';

const getDatabaseConfig = () => {
  const baseConfig = {
    logging: isDevelopment ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
      evict: 1000
    },
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    }
  };

  if (DB_DIALECT === 'postgres') {
    return {
      ...baseConfig,
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    };
  }

  if (DB_DIALECT === 'sqlite') {
    return {
      ...baseConfig,
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || 'database.sqlite'
    };
  }

  return {
    ...baseConfig,
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialectOptions: {
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    }
  };
};

const sequelize = new Sequelize(getDatabaseConfig());

const setupAssociations = () => {
  const User = require('../modules/user/models/User');
  const Post = require('../modules/social/models/Post');
  const PostLike = require('../modules/social/models/PostLike');
  const PostComment = require('../modules/social/models/PostComment');
  const Room = require('../modules/social/models/Room');
  const RoomMember = require('../modules/social/models/RoomMember');
  const RoomMessage = require('../modules/social/models/RoomMessage');
  const ChatMessage = require('../modules/chat/models/ChatMessage');

  User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
  Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

  Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
  PostLike.belongsTo(Post, { foreignKey: 'postId' });
  PostLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
  PostComment.belongsTo(Post, { foreignKey: 'postId' });
  PostComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

  PostComment.hasMany(PostComment, { foreignKey: 'parentId', as: 'replies' });
  PostComment.belongsTo(PostComment, { foreignKey: 'parentId', as: 'parent' });

  User.hasMany(Room, { foreignKey: 'ownerId', as: 'ownedRooms' });
  Room.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

  Room.hasMany(RoomMember, { foreignKey: 'roomId', as: 'members' });
  RoomMember.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
  User.hasMany(RoomMember, { foreignKey: 'userId', as: 'roomMemberships' });
  RoomMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  Room.hasMany(RoomMessage, { foreignKey: 'roomId', as: 'messages' });
  RoomMessage.belongsTo(Room, { foreignKey: 'roomId' });
  User.hasMany(RoomMessage, { foreignKey: 'senderId', as: 'roomMessages' });
  RoomMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

  User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  User.hasMany(ChatMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ ${DB_DIALECT.toUpperCase()} 数据库连接成功`);
  } catch (error) {
    console.error(`❌ ${DB_DIALECT.toUpperCase()} 数据库连接失败:`, error.message);
    if (isProduction) {
      process.exit(1);
    }
  }
};

const syncModels = async () => {
  try {
    setupAssociations();
    await sequelize.sync({ alter: isDevelopment, force: false });
    console.log('✅ 数据库模型同步成功');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error.message);
    if (isProduction) {
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = {
  sequelize,
  connectDB,
  syncModels,
  closeDB,
  DB_DIALECT
};
