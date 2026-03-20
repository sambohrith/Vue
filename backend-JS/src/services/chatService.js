const { ChatMessage, User, Sequelize, sequelize } = require('../models');

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

const getAllConversations = async (page = 1, limit = 50) => {
  try {
    // 验证参数
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    // 获取所有消息，按创建时间倒序排序
    const messages = await ChatMessage.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'username', 'fullName'] },
        { model: User, as: 'Receiver', attributes: ['id', 'username', 'fullName'] }
      ]
    });
    
    // 构建唯一对话映射，避免重复
    const conversationMap = new Map();
    
    for (const message of messages) {
      // 确保消息对象有效
      if (!message || !message.senderId || !message.receiverId) {
        continue;
      }
      
      // 创建唯一对话键，确保顺序一致（小ID在前，大ID在后）
      const user1Id = Math.min(message.senderId, message.receiverId);
      const user2Id = Math.max(message.senderId, message.receiverId);
      const conversationKey = `${user1Id}-${user2Id}`;
      
      // 如果对话不存在，创建新对话
      if (!conversationMap.has(conversationKey)) {
        const sender = message.Sender;
        const receiver = message.Receiver;
        
        const user1 = user1Id === message.senderId ? sender : receiver;
        const user2 = user2Id === message.senderId ? sender : receiver;
        
        conversationMap.set(conversationKey, {
          key: conversationKey,
          user1Id,
          user2Id,
          user1Name: user1 ? (user1.fullName || user1.username || '未知用户') : '未知用户',
          user2Name: user2 ? (user2.fullName || user2.username || '未知用户') : '未知用户',
          messageCount: 0,
          lastMessage: message.content || '',
          lastMessageTime: message.createdAt && !isNaN(new Date(message.createdAt)) ? new Date(message.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
        });
      }
      
      // 增加消息计数
      const conversation = conversationMap.get(conversationKey);
      if (conversation) {
        conversation.messageCount++;
      }
    }
    
    // 将映射转换为数组，并按最后消息时间倒序排序
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => {
        const dateA = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(0);
        const dateB = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(0);
        return dateB - dateA;
      });
    
    // 实现分页
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedConversations = conversations.slice(startIndex, endIndex);
    
    return paginatedConversations;
  } catch (error) {
    console.error('Error in getAllConversations:', error);
    throw error;
  }
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
