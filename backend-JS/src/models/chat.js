const { sequelize, Sequelize } = require('./database');
const User = require('./user');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  receiverId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'receiver_id',
    references: {
      model: User,
      key: 'id'
    }
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

ChatMessage.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
ChatMessage.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

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
    field: 'owner_id',
    references: {
      model: User,
      key: 'id'
    }
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

Room.belongsTo(User, { as: 'Owner', foreignKey: 'ownerId' });

const RoomMember = sequelize.define('RoomMember', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'room_id',
    references: {
      model: Room,
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

RoomMember.belongsTo(Room, { foreignKey: 'roomId' });
RoomMember.belongsTo(User, { foreignKey: 'userId' });

const RoomMessage = sequelize.define('RoomMessage', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  roomId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'room_id',
    references: {
      model: Room,
      key: 'id'
    }
  },
  senderId: {
    type: Sequelize.BIGINT,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: User,
      key: 'id'
    }
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

RoomMessage.belongsTo(Room, { foreignKey: 'roomId' });
RoomMessage.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });

module.exports = {
  ChatMessage,
  Room,
  RoomMember,
  RoomMessage
};
