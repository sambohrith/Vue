const { roomService } = require('../services');
const { success, created, error } = require('../utils/response');

const getPublicRooms = async (req, res) => {
  try {
    const rooms = await roomService.getPublicRooms();
    return success(res, { rooms, total: rooms.length }, '获取成功');
  } catch (err) {
    return error(res, 500, '获取房间失败');
  }
};

const getMyRooms = async (req, res) => {
  try {
    const rooms = await roomService.getMyRooms(req.userId);
    return success(res, { rooms, total: rooms.length }, '获取成功');
  } catch (err) {
    return error(res, 500, '获取房间失败');
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await roomService.getRoom(parseInt(req.params.id), req.userId);
    return success(res, room, '获取成功');
  } catch (err) {
    return error(res, 404, err.message);
  }
};

const createRoom = async (req, res) => {
  try {
    const room = await roomService.createRoom(req.userId, req.body);
    return created(res, room, '创建成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const deleteRoom = async (req, res) => {
  try {
    await roomService.deleteRoom(parseInt(req.params.id), req.userId);
    return success(res, null, '房间已删除');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const joinRoom = async (req, res) => {
  try {
    await roomService.joinRoom(parseInt(req.params.id), req.userId);
    return success(res, null, '加入成功');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const leaveRoom = async (req, res) => {
  try {
    await roomService.leaveRoom(parseInt(req.params.id), req.userId);
    return success(res, null, '已离开房间');
  } catch (err) {
    return error(res, 400, err.message);
  }
};

const getRoomMembers = async (req, res) => {
  try {
    const members = await roomService.getRoomMembers(parseInt(req.params.id));
    return success(res, { members }, '获取成功');
  } catch (err) {
    return error(res, 500, '获取成员失败');
  }
};

const getRoomMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await roomService.getRoomMessages(parseInt(req.params.id), page, limit);
    return success(res, result, '获取成功');
  } catch (err) {
    return error(res, 500, '获取消息失败');
  }
};

const sendRoomMessage = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return error(res, 400, '内容不能为空');
    }
    
    const message = await roomService.sendRoomMessage(parseInt(req.params.id), req.userId, content);
    return success(res, message, '发送成功');
  } catch (err) {
    return error(res, 500, '发送消息失败');
  }
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
