const { sequelize, Sequelize } = require('./database');

const Post = sequelize.define('Post', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  images: {
    type: Sequelize.TEXT
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'posts',
  paranoid: true,
  deletedAt: 'deletedAt'
});

const PostLike = sequelize.define('PostLike', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'post_id'
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  }
}, {
  tableName: 'post_likes',
  paranoid: true,
  deletedAt: 'deletedAt'
});

const PostComment = sequelize.define('PostComment', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'post_id'
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  parentId: {
    type: Sequelize.BIGINT,
    field: 'parent_id'
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  tableName: 'post_comments',
  paranoid: true,
  deletedAt: 'deletedAt'
});

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: Sequelize.TEXT
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: false
});

module.exports = {
  Post,
  PostLike,
  PostComment,
  SystemSettings
};
