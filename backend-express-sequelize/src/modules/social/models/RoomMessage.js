const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class RoomMessage extends Model {
  toPublicJSON() {
    const message = this.toJSON();
    return message;
  }
}

RoomMessage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rooms',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  senderId: {
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
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'text'
  }
}, {
  sequelize,
  modelName: 'RoomMessage',
  tableName: 'room_messages',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['room_id'] },
    { fields: ['sender_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = RoomMessage;
