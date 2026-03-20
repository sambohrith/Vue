const { sequelize, Sequelize } = require('./database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'sender_id'
  },
  receiverId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'receiver_id'
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  isRead: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  }
}, {
  tableName: 'chat_messages',
  paranoid: true,
  deletedAt: 'deletedAt'
});

const Room = sequelize.define('Room', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  },
  ownerId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'owner_id'
  },
  type: {
    type: Sequelize.STRING(20),
    defaultValue: 'public'
  },
  maxMembers: {
    type: Sequelize.INTEGER,
    defaultValue: 100,
    field: 'max_members'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'rooms',
  paranoid: true,
  deletedAt: 'deletedAt'
});

const RoomMember = sequelize.define('RoomMember', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'room_id'
  },
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  role: {
    type: Sequelize.STRING(20),
    defaultValue: 'member'
  },
  joinedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
    field: 'joined_at'
  }
}, {
  tableName: 'room_members',
  paranoid: true,
  deletedAt: 'deletedAt'
});

const RoomMessage = sequelize.define('RoomMessage', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'room_id'
  },
  senderId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'sender_id'
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  tableName: 'room_messages',
  paranoid: true,
  deletedAt: 'deletedAt'
});

module.exports = {
  ChatMessage,
  Room,
  RoomMember,
  RoomMessage
};
