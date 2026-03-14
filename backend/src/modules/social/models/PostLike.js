const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class PostLike extends Model {}

PostLike.init({
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
  }
}, {
  sequelize,
  modelName: 'PostLike',
  tableName: 'post_likes',
  timestamps: true,
  underscored: false,
  indexes: [
    { 
      fields: ['postId', 'userId'], 
      unique: true,
      name: 'unique_post_like'
    }
  ]
});

module.exports = PostLike;
