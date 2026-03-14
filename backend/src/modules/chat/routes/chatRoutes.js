const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate, authorize } = require('../../../middleware/auth');

// 用户聊天功能
router.get('/list', authenticate, chatController.getChatList);
router.get('/unread', authenticate, chatController.getUnreadCount);
router.get('/history/:userId', authenticate, chatController.getMessageHistory);
router.post('/send', authenticate, chatController.sendMessage);
router.put('/read/:userId', authenticate, chatController.markAsRead);

// 管理员功能
router.get('/admin/messages', authenticate, authorize('admin'), chatController.getAllMessages);
router.get('/admin/conversations', authenticate, authorize('admin'), chatController.getAllConversations);

// 诊断和修复功能（仅管理员）
router.get('/admin/diagnose', authenticate, authorize('admin'), chatController.diagnoseChatMessages);
router.post('/admin/fix', authenticate, authorize('admin'), chatController.fixChatMessages);

module.exports = router;
