const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class PostComment extends Model {
  /**
   * 获取评论的回复列表
   * @returns {Promise<PostComment[]>}
   */
  async getReplies() {
    return await this.getChildren({
      include: [{
        association: 'author',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * 静态方法：获取帖子的评论列表（包含回复）
   * @param {number} postId - 帖子ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} { count, rows }
   */
  static async getCommentsByPostId(postId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    return await this.findAndCountAll({
      where: { 
        postId,
        parentId: null // 只获取一级评论
      },
      include: [
        {
          association: 'author',
          attributes: ['id', 'username', 'fullName', 'avatar']
        },
        {
          association: 'replies',
          include: [{
            association: 'author',
            attributes: ['id', 'username', 'fullName', 'avatar']
          }],
          limit: 5 // 每个评论最多显示5条回复
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }
}

PostComment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
      len: [1, 1000]
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'post_comments',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: '回复的评论ID，支持二级评论'
  }
}, {
  sequelize,
  modelName: 'PostComment',
  tableName: 'post_comments',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['postId'] },
    { fields: ['userId'] },
    { fields: ['parentId'] }
  ]
});

module.exports = PostComment;
