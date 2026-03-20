const { Room, RoomMember, RoomMessage, User, Sequelize } = require('../models');
const Op = Sequelize.Op;
const { v4: uuidv4 } = require('uuid');

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getPublicRooms = async () => {
  try {
    const rooms = await Room.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'Owner', attributes: ['id', 'username', 'fullName'] }]
    });

    console.log('Rooms found:', rooms.length);

    const response = await Promise.all(rooms.map(async (room) => {
      console.log('Processing room:', room.id, room.name);
      
      const memberCount = await RoomMember.count({ where: { roomId: room.id } });
      const messageCount = await RoomMessage.count({ where: { roomId: room.id } });

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        isPublic: room.isActive,
        ownerId: room.ownerId,
        ownerName: room.Owner ? (room.Owner.fullName || room.Owner.username) : '',
        memberCount,
        messageCount
      };
    }));

    return response;
  } catch (error) {
    console.error('Error in getPublicRooms:', error);
    throw error;
  }
};

const getMyRooms = async (userId) => {
  const members = await RoomMember.findAll({
    where: { userId }
  });

  const roomIds = members.map(m => m.roomId);

  if (roomIds.length === 0) {
    return [];
  }

  const rooms = await Room.findAll({
    where: {
      id: { [Op.in]: roomIds },
      isActive: true
    },
    include: [{ model: User, as: 'Owner', attributes: ['id', 'username', 'fullName'] }]
  });

    const response = await Promise.all(rooms.map(async (room) => {
    const memberCount = await RoomMember.count({ where: { roomId: room.id } });
    const messageCount = await RoomMessage.count({ where: { roomId: room.id } });

    let createdAt = null;
    try {
      if (room.createdAt && room.createdAt instanceof Date && !isNaN(room.createdAt.getTime())) {
        createdAt = room.createdAt.toISOString().replace('T', ' ').substring(0, 19);
      }
    } catch (e) {
      console.error('Error formatting createdAt:', e);
    }

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      isPublic: room.isActive,
      ownerId: room.ownerId,
      ownerName: room.Owner ? (room.Owner.fullName || room.Owner.username) : '',
      memberCount,
      createdAt,
      messageCount
    };
  }));

  return response;
};

const getRoom = async (roomId, userId) => {
  const room = await Room.findByPk(roomId, {
    include: [{ model: User, as: 'Owner', attributes: ['id', 'username', 'fullName'] }]
  });

  if (!room) {
    throw new Error('房间不存在');
  }

  const memberCount = await RoomMember.count({ where: { roomId: room.id } });
  const messageCount = await RoomMessage.count({ where: { roomId: room.id } });

  let createdAt = null;
  try {
    if (room.createdAt && room.createdAt instanceof Date && !isNaN(room.createdAt.getTime())) {
      createdAt = room.createdAt.toISOString().replace('T', ' ').substring(0, 19);
    }
  } catch (e) {
    console.error('Error formatting createdAt:', e);
  }

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    isPublic: room.isActive,
    ownerId: room.ownerId,
    ownerName: room.Owner ? (room.Owner.fullName || room.Owner.username) : '',
    memberCount,
    createdAt,
    messageCount
  };
};

const createRoom = async (userId, req) => {
  const { name, description } = req;

  const room = await Room.create({
    name,
    description,
    ownerId: userId,
    isActive: true
  });

  await RoomMember.create({
    roomId: room.id,
    userId: userId,
    role: 'owner'
  });

  let createdAt = null;
  try {
    if (room.createdAt && room.createdAt instanceof Date && !isNaN(room.createdAt.getTime())) {
      createdAt = room.createdAt.toISOString().replace('T', ' ').substring(0, 19);
    }
  } catch (e) {
    console.error('Error formatting createdAt:', e);
  }

  return {
    id: room.id,
    name: room.name,
    description: room.description,
    isPublic: room.isActive,
    ownerId: room.ownerId,
    memberCount: 1,
    createdAt
  };
};

const deleteRoom = async (roomId, userId) => {
  const room = await Room.findByPk(roomId);

  if (!room) {
    throw new Error('房间不存在');
  }

  if (room.ownerId !== userId) {
    throw new Error('只有房主才能删除房间');
  }

  await room.destroy();
  return { success: true };
};

const joinRoom = async (roomId, userId) => {
  const room = await Room.findByPk(roomId);
  if (!room) {
    throw new Error('房间不存在');
  }

  const existingMember = await RoomMember.findOne({
    where: { roomId, userId }
  });

  if (existingMember) {
    throw new Error('已经加入该房间');
  }

  await RoomMember.create({
    roomId,
    userId,
    role: 'member'
  });

  return { success: true };
};

const leaveRoom = async (roomId, userId) => {
  const member = await RoomMember.findOne({
    where: { roomId, userId }
  });

  if (!member) {
    throw new Error('您不是该房间的成员');
  }

  if (member.role === 'owner') {
    throw new Error('房主不能离开房间，请先转让房主或删除房间');
  }

  await member.destroy();
  return { success: true };
};

const getRoomMembers = async (roomId) => {
  const members = await RoomMember.findAll({
    where: { roomId },
    include: [{ model: User, attributes: ['id', 'username', 'fullName', 'avatar'] }]
  });

  return members.map(m => {
    let joinedAt = null;
    try {
      if (m.joinedAt && m.joinedAt instanceof Date && !isNaN(m.joinedAt.getTime())) {
        joinedAt = m.joinedAt.toISOString().replace('T', ' ').substring(0, 19);
      }
    } catch (e) {
      console.error('Error formatting joinedAt:', e);
    }
    
    return {
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      userName: m.User ? (m.User.fullName || m.User.username) : '',
      userAvatar: m.User ? m.User.avatar : '',
      role: m.role,
      joinedAt
    };
  });
};

const getRoomMessages = async (roomId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await RoomMessage.findAndCountAll({
    where: { roomId },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [{ model: User, as: 'Sender', attributes: ['id', 'username', 'fullName', 'avatar'] }]
  });

  const messages = rows.reverse().map(msg => {
    let createdAt = null;
    try {
      if (msg.createdAt && msg.createdAt instanceof Date && !isNaN(msg.createdAt.getTime())) {
        createdAt = msg.createdAt.toISOString().replace('T', ' ').substring(0, 19);
      }
    } catch (e) {
      console.error('Error formatting createdAt:', e);
    }
    
    return {
      id: msg.id,
      content: msg.content,
      userId: msg.senderId,
      userName: msg.Sender ? (msg.Sender.fullName || msg.Sender.username) : '',
      userAvatar: msg.Sender ? msg.Sender.avatar : '',
      roomId: msg.roomId,
      createdAt
    };
  });

  return {
    messages,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

const sendRoomMessage = async (roomId, userId, content) => {
  const message = await RoomMessage.create({
    roomId,
    senderId: userId,
    content
  });

  const sender = await User.findByPk(userId);

  let createdAt = null;
  try {
    if (message.createdAt && message.createdAt instanceof Date && !isNaN(message.createdAt.getTime())) {
      createdAt = message.createdAt.toISOString().replace('T', ' ').substring(0, 19);
    }
  } catch (e) {
    console.error('Error formatting createdAt:', e);
  }

  return {
    id: message.id,
    content: message.content,
    userId: message.senderId,
    userName: sender ? (sender.fullName || sender.username) : '',
    userAvatar: sender ? sender.avatar : '',
    roomId: message.roomId,
    createdAt
  };
};

module.exports = {
  getPublicRooms,
  getMyRooms,
  getRoom,
  createRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  getRoomMessages,
  sendRoomMessage
};
