const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');
const User = require('../../user/models/User');

class ChatMessage extends Model {
  toPublicJSON() {
    const message = this.toJSON();
    return message;
  }
}

ChatMessage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'ChatMessage',
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['sender_id', 'receiver_id', 'created_at']
    },
    {
      fields: ['receiver_id', 'is_read']
    }
  ]
});

module.exports = ChatMessage;
