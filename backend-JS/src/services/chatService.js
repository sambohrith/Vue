const { ChatMessage, User, Sequelize } = require('../models');

const getChatList = async (currentUserId) => {
  const users = await User.findAll({
    where: {
      id: { [Sequelize.Op.ne]: currentUserId },
      isActive: true
    },
    attributes: ['id', 'username', 'email', 'fullName', 'avatar']
  });

  const contacts = await Promise.all(users.map(async (user) => {
    const lastMessage = await ChatMessage.findOne({
      where: {
        [Sequelize.Op.or]: [
          { senderId: currentUserId, receiverId: user.id },
          { senderId: user.id, receiverId: currentUserId }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = await ChatMessage.count({
      where: {
        senderId: user.id,
        receiverId: currentUserId,
        isRead: false
      }
    });

    return {
      id: user.id,
      userId: user.id,
      name: user.fullName || user.username,
      email: user.email,
      avatar: user.avatar,
      lastMessage: lastMessage ? lastMessage.content : '',
      lastMessageTime: lastMessage ? lastMessage.createdAt.toISOString().replace('T', ' ').substring(0, 19) : '',
      unreadCount
    };
  }));

  return contacts;
};

const getChatHistory = async (currentUserId, otherUserId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await ChatMessage.findAndCountAll({
    where: {
      [Sequelize.Op.or]: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: User, as: 'Sender', attributes: ['id', 'username', 'fullName'] },
      { model: User, as: 'Receiver', attributes: ['id', 'username', 'fullName'] }
    ]
  });

  const messages = rows.reverse().map(msg => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    senderName: msg.Sender ? (msg.Sender.fullName || msg.Sender.username) : '',
    receiverId: msg.receiverId,
    receiverName: msg.Receiver ? (msg.Receiver.fullName || msg.Receiver.username) : '',
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString().replace('T', ' ').substring(0, 19)
  }));

  return {
    messages,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

const sendMessage = async (currentUserId, receiverId, content) => {
  const message = await ChatMessage.create({
    senderId: currentUserId,
    receiverId: receiverId,
    content,
    isRead: false
  });

  const sender = await User.findByPk(currentUserId);
  const receiver = await User.findByPk(receiverId);

  return {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderName: sender ? (sender.fullName || sender.username) : '',
    receiverId: message.receiverId,
    receiverName: receiver ? (receiver.fullName || receiver.username) : '',
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString().replace('T', ' ').substring(0, 19)
  };
};

const markAsRead = async (currentUserId, otherUserId) => {
  await ChatMessage.update(
    { isRead: true },
    {
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false
      }
    }
  );
  return { success: true };
};

const getUnreadCount = async (currentUserId) => {
  const count = await ChatMessage.count({
    where: {
      receiverId: currentUserId,
      isRead: false
    }
  });
  return { count };
};

const getAllMessages = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await ChatMessage.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: User, as: 'Sender', attributes: ['id', 'username', 'fullName'] },
      { model: User, as: 'Receiver', attributes: ['id', 'username', 'fullName'] }
    ]
  });

  const messages = rows.map(msg => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    senderName: msg.Sender ? (msg.Sender.fullName || msg.Sender.username) : '',
    receiverId: msg.receiverId,
    receiverName: msg.Receiver ? (msg.Receiver.fullName || msg.Receiver.username) : '',
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString().replace('T', ' ').substring(0, 19)
  }));

  return {
    messages,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

const getAllConversations = async () => {
  const messages = await ChatMessage.findAll({
    attributes: [
      'senderId',
      'receiverId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'messageCount'],
      [Sequelize.fn('MAX', Sequelize.col('created_at')), 'lastMessageTime']
    ],
    group: ['senderId', 'receiverId'],
    order: [[Sequelize.fn('MAX', Sequelize.col('created_at')), 'DESC']]
  });

  return messages;
};

module.exports = {
  getChatList,
  getChatHistory,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getAllMessages,
  getAllConversations
};
