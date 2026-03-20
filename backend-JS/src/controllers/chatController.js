const { chatService } = require('../services');
const { success, error } = require('../utils/response');

const getChatList = async (req, res) => {
  try {
    const contacts = await chatService.getChatList(req.userId);
    return success(res, { contacts, total: contacts.length }, '获取成功');
  } catch (err) {
    return error(res, 500, '获取联系人失败');
  }
};

const getChatHistory = async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await chatService.getChatHistory(req.userId, otherUserId, page, limit);
    return success(res, result, '获取成功');
  } catch (err) {
    return error(res, 500, '获取消息失败');
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return error(res, 400, '请求参数错误');
    }
    
    const message = await chatService.sendMessage(req.userId, receiverId, content);
    return success(res, message, '发送成功');
  } catch (err) {
    return error(res, 500, '发送消息失败');
  }
};

const markAsRead = async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);
    await chatService.markAsRead(req.userId, otherUserId);
    return success(res, null, '已标记为已读');
  } catch (err) {
    return error(res, 500, '操作失败');
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const result = await chatService.getUnreadCount(req.userId);
    return success(res, result, '获取成功');
  } catch (err) {
    return error(res, 500, '获取失败');
  }
};

const getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await chatService.getAllMessages(page, limit);
    return success(res, result, '获取成功');
  } catch (err) {
    console.error('[getAllMessages] Error:', err.message);
    console.error('[getAllMessages] Stack:', err.stack);
    return error(res, 500, '获取消息失败');
  }
};

const getAllConversations = async (req, res) => {
  try {
    console.log('getAllConversations called with query:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const conversations = await chatService.getAllConversations(page, limit);
    return success(res, { conversations }, '获取成功');
  } catch (err) {
    console.error('Error in getAllConversations:', err);
    return error(res, 500, '获取会话失败');
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
