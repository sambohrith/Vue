const { sequelize, Sequelize } = require('./database');
const User = require('./user');

const Post = sequelize.define('Post', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    }
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

Post.belongsTo(User, { as: 'Author', foreignKey: 'userId' });

const PostLike = sequelize.define('PostLike', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'post_id',
    references: {
      model: Post,
      key: 'id'
    }
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'post_likes',
  paranoid: true,
  deletedAt: 'deletedAt'
});

PostLike.belongsTo(Post, { foreignKey: 'postId' });
PostLike.belongsTo(User, { foreignKey: 'userId' });

const PostComment = sequelize.define('PostComment', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'post_id',
    references: {
      model: Post,
      key: 'id'
    }
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  parentId: {
    type: Sequelize.BIGINT,
    field: 'parent_id',
    references: {
      model: 'PostComments',
      key: 'id'
    }
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

PostComment.belongsTo(Post, { foreignKey: 'postId' });
PostComment.belongsTo(User, { as: 'Author', foreignKey: 'userId' });
PostComment.belongsTo(PostComment, { as: 'Parent', foreignKey: 'parentId' });

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
