const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const RoomMessage = require('../models/RoomMessage');
const User = require('../../user/models/User');
const { Op } = require('sequelize');

// 创建房间
async function createRoom(req, res) {
  try {
    const { name, description, type = 'public', maxMembers = 100 } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '房间名称不能为空' });
    }

    const room = await Room.create({
      name,
      description,
      type,
      maxMembers,
      ownerId: userId,
      inviteCode: Room.generateInviteCode()
    });

    // 创建者自动成为房主
    await RoomMember.create({
      roomId: room.id,
      userId,
      role: 'owner'
    });

    // 返回包含成员信息的房间
    const roomWithMembers = await Room.findByPk(room.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'fullName', 'avatar'] },
        { model: RoomMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatar'] }] }
      ]
    });

    res.status(201).json({
      success: true,
      message: '房间创建成功',
      data: { room: roomWithMembers }
    });
  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({ success: false, message: '创建失败' });
  }
}

// 获取我的房间列表
async function getMyRooms(req, res) {
  try {
    const userId = req.user.id;

    const memberships = await RoomMember.findAll({
      where: { userId },
      include: [
        {
          model: Room,
          as: 'room',
          include: [
            { model: User, as: 'owner', attributes: ['id', 'username', 'fullName'] }
          ]
        }
      ]
    });

    const rooms = memberships.map(m => ({
      ...m.room.toJSON(),
      myRole: m.role
    }));

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
}

// 获取公开房间列表
async function getPublicRooms(req, res) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { type: 'public' };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const rooms = await Room.findAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'fullName'] },
        { model: RoomMember, as: 'members' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // 添加成员数
    const roomsWithCount = rooms.map(room => ({
      ...room.toJSON(),
      memberCount: room.members.length
    }));

    const total = await Room.count({ where });

    res.json({
      success: true,
      data: {
        rooms: roomsWithCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取公开房间失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
}

// 获取房间详情
async function getRoomDetail(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'fullName', 'avatar'] },
        {
          model: RoomMember,
          as: 'members',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatar'] }]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    // 检查当前用户是否在房间中
    const membership = await RoomMember.findOne({
      where: { roomId, userId }
    });

    const isMember = !!membership;

    // 私密房间非成员不能查看详情
    if (room.type === 'private' && !isMember) {
      return res.status(403).json({ success: false, message: '无权查看该房间' });
    }

    res.json({
      success: true,
      data: {
        room: {
          ...room.toJSON(),
          isMember,
          myRole: membership ? membership.role : null
        }
      }
    });
  } catch (error) {
    console.error('获取房间详情失败:', error);
    res.status(500).json({ success: false, message: '获取失败' });
  }
}

// 通过邀请码加入房间
async function joinRoomByCode(req, res) {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({ where: { inviteCode } });

    if (!room) {
      return res.status(404).json({ success: false, message: '邀请码无效' });
    }

    // 检查是否已在房间中
    const isAlreadyMember = await RoomMember.isInRoom(room.id, userId);
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, message: '您已在该房间中' });
    }

    // 检查房间人数
    const memberCount = await RoomMember.count({ where: { roomId: room.id } });
    if (memberCount >= room.maxMembers) {
      return res.status(400).json({ success: false, message: '房间已满' });
    }

    // 加入房间
    await RoomMember.create({
      roomId: room.id,
      userId,
      role: 'member'
    });

    // 发送系统消息
    const user = await User.findByPk(userId);
    await RoomMessage.create({
      roomId: room.id,
      senderId: userId,
      content: `${user.fullName || user.username} 加入了房间`,
      type: 'system'
    });

    res.json({
      success: true,
      message: '加入房间成功',
      data: { roomId: room.id }
    });
  } catch (error) {
    console.error('加入房间失败:', error);
    res.status(500).json({ success: false, message: '加入失败' });
  }
}

// 通过房间ID加入房间（仅公开房间）
async function joinRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    // 检查是否为私密房间
    if (room.type === 'private') {
      return res.status(403).json({ success: false, message: '私密房间需要邀请码才能加入' });
    }

    // 检查是否已在房间中
    const isAlreadyMember = await RoomMember.isInRoom(roomId, userId);
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, message: '您已在该房间中' });
    }

    // 检查房间人数
    const memberCount = await RoomMember.count({ where: { roomId } });
    if (memberCount >= room.maxMembers) {
      return res.status(400).json({ success: false, message: '房间已满' });
    }

    // 加入房间
    await RoomMember.create({
      roomId,
      userId,
      role: 'member'
    });

    // 发送系统消息
    const user = await User.findByPk(userId);
    await RoomMessage.create({
      roomId,
      senderId: userId,
      content: `${user.fullName || user.username} 加入了房间`,
      type: 'system'
    });

    res.json({
      success: true,
      message: '加入房间成功',
      data: { roomId }
    });
  } catch (error) {
    console.error('加入房间失败:', error);
    res.status(500).json({ success: false, message: '加入失败' });
  }
}

// 退出房间
async function leaveRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const membership = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: '您不在该房间中' });
    }

    // 房主不能退出，只能解散或转让
    if (membership.role === 'owner') {
      return res.status(400).json({ success: false, message: '房主不能退出房间，请转让房主身份或解散房间' });
    }

    await membership.destroy();

    // 发送系统消息
    const user = await User.findByPk(userId);
    await RoomMessage.create({
      roomId,
      senderId: userId,
      content: `${user.fullName || user.username} 离开了房间`,
      type: 'system'
    });

    res.json({ success: true, message: '已退出房间' });
  } catch (error) {
    console.error('退出房间失败:', error);
    res.status(500).json({ success: false, message: '退出失败' });
  }
}

// 解散房间
async function dissolveRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    if (room.ownerId !== userId) {
      return res.status(403).json({ success: false, message: '只有房主可以解散房间' });
    }

    await room.destroy();

    res.json({ success: true, message: '房间已解散' });
  } catch (error) {
    console.error('解散房间失败:', error);
    res.status(500).json({ success: false, message: '解散失败' });
  }
}

// 更新房间信息
async function updateRoom(req, res) {
  try {
    const { roomId } = req.params;
    const { name, description, maxMembers } = req.body;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    // 检查权限
    const membership = await RoomMember.findOne({
      where: { roomId, userId }
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ success: false, message: '无权修改房间信息' });
    }

    await room.update({
      name: name || room.name,
      description: description !== undefined ? description : room.description,
      maxMembers: maxMembers || room.maxMembers
    });

    res.json({
      success: true,
      message: '房间信息已更新',
      data: { room }
    });
  } catch (error) {
    console.error('更新房间信息失败:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
}

// 刷新邀请码
async function refreshInviteCode(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: '房间不存在' });
    }

    if (room.ownerId !== userId) {
      return res.status(403).json({ success: false, message: '只有房主可以刷新邀请码' });
    }

    const newCode = Room.generateInviteCode();
    await room.update({ inviteCode: newCode });

    res.json({
      success: true,
      message: '邀请码已刷新',
      data: { inviteCode: newCode }
    });
  } catch (error) {
    console.error('刷新邀请码失败:', error);
    res.status(500).json({ success: false, message: '刷新失败' });
  }
}

module.exports = {
  createRoom,
  getMyRooms,
  getPublicRooms,
  getRoomDetail,
  joinRoom,
  joinRoomByCode,
  leaveRoom,
  dissolveRoom,
  updateRoom,
  refreshInviteCode
};
