const { Sequelize } = require('sequelize');

// 数据库类型: mysql | postgres | sqlite
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';

let sequelize;

// 根据数据库类型创建连接
if (DB_DIALECT === 'postgres') {
  // PostgreSQL 连接配置
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        // PostgreSQL 特定选项
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        // PostgreSQL 使用小写表名
        freezeTableName: true,
        underscored: true
      }
    }
  );
} else if (DB_DIALECT === 'sqlite') {
  // SQLite 连接配置
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || 'database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      freezeTableName: true,
      underscored: true
    }
  });
} else {
  // MySQL 连接配置（默认）
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        charset: 'utf8mb4',
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    }
  );
}

// 定义模型关联关系
const setupAssociations = () => {
  // 动态导入模型（避免循环依赖）
  const User = require('../modules/user/models/User');
  const Post = require('../modules/social/models/Post');
  const PostLike = require('../modules/social/models/PostLike');
  const PostComment = require('../modules/social/models/PostComment');
  const Room = require('../modules/social/models/Room');
  const RoomMember = require('../modules/social/models/RoomMember');
  const RoomMessage = require('../modules/social/models/RoomMessage');
  const ChatMessage = require('../modules/chat/models/ChatMessage');

  // User - Post 关联（说说）
  User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
  Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

  // Post - PostLike 关联
  Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });
  PostLike.belongsTo(Post, { foreignKey: 'postId' });
  PostLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Post - PostComment 关联
  Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
  PostComment.belongsTo(Post, { foreignKey: 'postId' });
  PostComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

  // 评论的回复关联（二级评论）
  PostComment.hasMany(PostComment, { foreignKey: 'parentId', as: 'replies' });
  PostComment.belongsTo(PostComment, { foreignKey: 'parentId', as: 'parent' });

  // Room 关联
  User.hasMany(Room, { foreignKey: 'ownerId', as: 'ownedRooms' });
  Room.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

  // RoomMember 关联
  Room.hasMany(RoomMember, { foreignKey: 'roomId', as: 'members' });
  RoomMember.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
  User.hasMany(RoomMember, { foreignKey: 'userId', as: 'roomMemberships' });
  RoomMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // RoomMessage 关联
  Room.hasMany(RoomMessage, { foreignKey: 'roomId', as: 'messages' });
  RoomMessage.belongsTo(Room, { foreignKey: 'roomId' });
  User.hasMany(RoomMessage, { foreignKey: 'senderId', as: 'roomMessages' });
  RoomMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

  // ChatMessage 关联
  User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
  User.hasMany(ChatMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
};

// 测试数据库连接
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`${DB_DIALECT.toUpperCase()} database connected successfully`);
  } catch (error) {
    console.error(`Error connecting to ${DB_DIALECT} database: ${error.message}`);
    process.exit(1);
  }
};

// 同步数据库模型（创建表结构）
const syncModels = async () => {
  try {
    // 设置模型关联关系（这会导入所有模型）
    setupAssociations();

    // 先尝试同步所有模型（只创建不存在的表）
    await sequelize.sync({ alter: false, force: false });
    console.log('Database models synced successfully');
  } catch (error) {
    console.error(`Error syncing database models: ${error.message}`);
    console.error('错误详情:', error);
    // 不退出进程，继续启动服务器
    console.log('警告: 数据库同步出现问题，但服务器将继续启动');
  }
};

module.exports = {
  sequelize,
  connectDB,
  syncModels,
  DB_DIALECT
};
