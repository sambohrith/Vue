const ChatMessage = require('../models/ChatMessage');
const User = require('../../user/models/User');
const { Op } = require('sequelize');
const { asyncHandler } = require('../../../middleware/errorHandler');
const { sequelize } = require('../../../config/database');

// 发送消息
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !content) {
    return res.status(400).json({
      success: false,
      message: '请提供接收者ID和消息内容'
    });
  }

  // 检查接收者是否存在
  const receiver = await User.findByPk(receiverId);
  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: '接收者不存在'
    });
  }

  // 不能给自己发送消息
  if (senderId === parseInt(receiverId)) {
    return res.status(400).json({
      success: false,
      message: '不能给自己发送消息'
    });
  }

  const message = await ChatMessage.create({
    senderId,
    receiverId,
    content,
    isRead: false
  });

  res.status(201).json({
    success: true,
    message: '消息发送成功',
    data: { message }
  });
});

// 获取消息历史
const getMessageHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const messages = await ChatMessage.findAll({
    where: {
      [Op.or]: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
      { model: User, as: 'receiver', attributes: ['id', 'username', 'fullName', 'avatar'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  // 标记消息为已读
  await ChatMessage.update(
    { isRead: true },
    {
      where: {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false
      }
    }
  );

  res.json({
    success: true,
    data: {
      messages: messages.reverse(), // 按时间正序返回
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }
  });
});

// 获取聊天列表
const getChatList = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 获取所有与该用户相关的消息
  const messages = await ChatMessage.findAll({
    where: {
      [Op.or]: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
      { model: User, as: 'receiver', attributes: ['id', 'username', 'fullName', 'avatar'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  // 构建聊天列表
  const chatMap = new Map();

  messages.forEach(msg => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!chatMap.has(partnerId)) {
      chatMap.set(partnerId, {
        userId: partnerId,
        username: partner ? partner.username : '未知用户',
        fullName: partner ? partner.fullName : '未知用户',
        avatar: partner ? partner.avatar : null,
        lastMessage: {
          content: msg.content,
          createdAt: msg.createdAt,
          isMine: msg.senderId === userId
        },
        unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0
      });
    } else if (msg.receiverId === userId && !msg.isRead) {
      const chat = chatMap.get(partnerId);
      chat.unreadCount++;
    }
  });

  const chatList = Array.from(chatMap.values());

  res.json({
    success: true,
    data: { chatList }
  });
});

// 标记消息为已读
const markAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  await ChatMessage.update(
    { isRead: true },
    {
      where: {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false
      }
    }
  );

  res.json({
    success: true,
    message: '消息已标记为已读'
  });
});

// 获取未读消息数
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const count = await ChatMessage.count({
    where: {
      receiverId: userId,
      isRead: false
    }
  });

  res.json({
    success: true,
    data: { unreadCount: count }
  });
});

// 管理员获取所有消息
const getAllMessages = asyncHandler(async (req, res) => {
  // 验证是否为管理员
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  }

  const { page = 1, limit = 50, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.content = { [Op.like]: `%${search}%` };
  }

  const messages = await ChatMessage.findAll({
    where,
    include: [
      { model: User, as: 'sender', attributes: ['id', 'username', 'fullName'] },
      { model: User, as: 'receiver', attributes: ['id', 'username', 'fullName'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  const total = await ChatMessage.count({ where });

  res.json({
    success: true,
    data: {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// 管理员获取所有对话列表
const getAllConversations = asyncHandler(async (req, res) => {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const { page = 1, limit = 50, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.content = { [Op.like]: `%${search}%` };
    }

    const messages = await ChatMessage.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('获取到消息数量:', messages.length);

    // 收集所有需要查询的用户ID
    const userIdsToQuery = new Set();
    messages.forEach(msg => {
      if (!msg.sender) userIdsToQuery.add(msg.senderId);
      if (!msg.receiver) userIdsToQuery.add(msg.receiverId);
    });

    // 批量查询缺失的用户信息
    const userCache = new Map();
    if (userIdsToQuery.size > 0) {
      const missingUsers = await User.findAll({
        where: {
          id: {
            [Op.in]: Array.from(userIdsToQuery)
          }
        },
        attributes: ['id', 'username', 'fullName', 'avatar']
      });
      missingUsers.forEach(user => {
        userCache.set(user.id, user);
      });
    }

    // 辅助函数：获取用户信息
    const getUserInfo = (userId, association) => {
      if (association) {
        return {
          id: association.id,
          name: association.fullName || association.username || `用户${userId}`,
          avatar: association.avatar
        };
      }
      const cachedUser = userCache.get(userId);
      if (cachedUser) {
        return {
          id: cachedUser.id,
          name: cachedUser.fullName || cachedUser.username || `用户${userId}`,
          avatar: cachedUser.avatar
        };
      }
      return {
        id: userId,
        name: `用户${userId}`,
        avatar: null
      };
    };

    // 构建对话列表
    const conversations = new Map();

    messages.forEach(msg => {
      const key = msg.senderId < msg.receiverId
        ? `${msg.senderId}-${msg.receiverId}`
        : `${msg.receiverId}-${msg.senderId}`;

      if (!conversations.has(key)) {
        const user1Id = msg.senderId < msg.receiverId ? msg.senderId : msg.receiverId;
        const user2Id = msg.senderId < msg.receiverId ? msg.receiverId : msg.senderId;
        const user1Association = msg.senderId < msg.receiverId ? msg.sender : msg.receiver;
        const user2Association = msg.senderId < msg.receiverId ? msg.receiver : msg.sender;
        
        const user1Info = getUserInfo(user1Id, user1Association);
        const user2Info = getUserInfo(user2Id, user2Association);
        
        conversations.set(key, {
          user1Id: user1Info.id,
          user1Name: user1Info.name,
          user1Avatar: user1Info.avatar,
          user2Id: user2Info.id,
          user2Name: user2Info.name,
          user2Avatar: user2Info.avatar,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          messageCount: 1
        });
      } else {
        const conv = conversations.get(key);
        conv.messageCount++;
      }
    });

    const convList = Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    console.log('构建对话数量:', convList.length);
    console.log('对话详情:', convList);

    // 分页
    const total = convList.length;
    const paginatedList = convList.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        conversations: paginatedList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取聊天监控失败:', error);
    res.status(500).json({ success: false, message: '获取失败: ' + error.message });
  }
});

// 诊断和修复聊天消息数据
const diagnoseChatMessages = asyncHandler(async (req, res) => {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 1. 查询所有用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'fullName'],
      order: [['id', 'ASC']]
    });

    // 2. 查询消息统计
    const [distinctStats] = await sequelize.query(`
      SELECT DISTINCT sender_id, receiver_id, COUNT(*) as count
      FROM chat_messages
      GROUP BY sender_id, receiver_id
    `);

    // 3. 查询有问题的消息数量
    const badMessages = await ChatMessage.count({
      where: {
        [Op.or]: [
          { senderId: 0 },
          { receiverId: 0 }
        ]
      }
    });

    const result = {
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName
        })),
        messageStats: distinctStats,
        badMessageCount: badMessages,
        canFix: users.length >= 2 && badMessages > 0
      }
    };

    console.log('诊断结果:', JSON.stringify(result.data, null, 2));

    res.json(result);
  } catch (error) {
    console.error('诊断失败:', error);
    res.status(500).json({ success: false, message: '诊断失败: ' + error.message });
  }
});

// 修复聊天消息数据
const fixChatMessages = asyncHandler(async (req, res) => {
  try {
    // 验证是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    let { senderId, receiverId } = req.body;

    // 如果没有提供用户ID，自动获取前两个用户
    if (!senderId || !receiverId) {
      const users = await User.findAll({
        attributes: ['id', 'username', 'fullName'],
        order: [['id', 'ASC']],
        limit: 2
      });

      if (users.length < 2) {
        return res.status(400).json({
          success: false,
          message: '系统中至少需要2个用户才能修复消息数据'
        });
      }

      senderId = users[0].id;
      receiverId = users[1].id;
    }

    // 验证用户是否存在
    const sender = await User.findByPk(senderId);
    const receiver = await User.findByPk(receiverId);

    if (!sender || !receiver) {
      return res.status(400).json({
        success: false,
        message: '指定的用户不存在'
      });
    }

    // 更新有问题的消息
    const [updatedCount] = await ChatMessage.update(
      { senderId, receiverId },
      {
        where: {
          [Op.or]: [
            { senderId: 0 },
            { receiverId: 0 }
          ]
        }
      }
    );

    console.log(`修复完成：更新了 ${updatedCount} 条消息`);
    console.log(`senderId: ${senderId} (${sender.username}), receiverId: ${receiverId} (${receiver.username})`);

    res.json({
      success: true,
      message: `成功修复 ${updatedCount} 条消息`,
      data: {
        updatedCount,
        sender: { id: sender.id, username: sender.username, fullName: sender.fullName },
        receiver: { id: receiver.id, username: receiver.username, fullName: receiver.fullName }
      }
    });
  } catch (error) {
    console.error('修复失败:', error);
    res.status(500).json({ success: false, message: '修复失败: ' + error.message });
  }
});

module.exports = {
  sendMessage,
  getMessageHistory,
  getChatList,
  markAsRead,
  getUnreadCount,
  getAllMessages,
  getAllConversations,
  diagnoseChatMessages,
  fixChatMessages
};
