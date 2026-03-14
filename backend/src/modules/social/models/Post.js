const { DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require('../../../config/database');

class Post extends Model {
  // 获取带有点赞和评论数量的帖子
  async getWithCounts() {
    const post = this.toJSON();
    post.likeCount = await this.countLikes();
    post.commentCount = await this.countComments();
    return post;
  }

  // 增加浏览次数
  async incrementViews() {
    this.viewCount += 1;
    return await this.save({ hooks: false, validate: false });
  }

  // 检查用户是否点赞
  async isLikedBy(userId) {
    const like = await sequelize.models.PostLike.findOne({
      where: { postId: this.id, userId }
    });
    return !!like;
  }

  // 静态方法：获取圈子动态（所有用户的公开说说）
  static async getCirclePosts(options = {}) {
    const { page = 1, limit = 20, userId } = options;
    const offset = (page - 1) * limit;

    const where = { isPublic: true };
    if (userId) {
      where.userId = userId;
    }

    return await this.findAndCountAll({
      where,
      include: [{
        association: 'author',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  // 静态方法：搜索说说
  static async searchPosts(keyword, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    return await this.findAndCountAll({
      where: {
        isPublic: true,
        content: { [Op.like]: `%${keyword}%` }
      },
      include: [{
        association: 'author',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }
}

Post.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '图片URL数组'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否公开显示在圈子'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '浏览次数'
  }
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'posts',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['createdAt'] },
    { fields: ['isPublic', 'createdAt'] }
  ]
});

module.exports = Post;
