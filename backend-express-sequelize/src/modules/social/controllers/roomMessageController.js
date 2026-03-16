const RoomMessage = require('../models/RoomMessage');
const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const User = require('../../user/models/User');
const { Op } = require('sequelize');

// 发送房间消息
async function sendRoomMessage(req, res) {
  try {
    const { roomId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '消息内容不能为空' });
    }

    // 检查房间是否存在
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    // 检查是否是房间成员
    const isMember = await RoomMember.isInRoom(roomId, userId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: '您不在该房间中' });
    }

    const message = await RoomMessage.create({
      roomId,
      senderId: userId,
      content,
      type
    });

    // 返回包含发送者信息的消息
    const messageWithSender = await RoomMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: '发送成功',
      data: { message: messageWithSender }
    });
  } catch (error) {
    console.error('发送房间消息失败:', error);
    res.status(500).json({ success: false, message: '发送失败' });
  }
}

// 获取房间消息
async function getRoomMessages(req, res) {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user.id;

    // 检查房间是否存在
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    // 检查是否是房间成员（私密房间）
    if (room.type === 'private') {
      const isMember = await RoomMember.isInRoom(roomId, userId);
      if (!isMember) {
        return res.status(403).json({ success: false, message: '您不在该房间中' });
      }
    }

    const where = { roomId };
    if (before) {
      where.createdAt = { [Op.lt]: new Date(before) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const messages = await RoomMessage.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'fullName', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

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
  } catch (error) {
    console.error('获取房间消息失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
}

module.exports = {
  sendRoomMessage,
  getRoomMessages
};
