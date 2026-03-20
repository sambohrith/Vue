const express = require('express');
const { auth, roleAuth } = require('../middleware/auth');
const { authController, userController, chatController, roomController, socialController, systemController } = require('../controllers');

const router = express.Router();

const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
};

const placeholderHandler = (req, res) => {
  res.json({
    success: true,
    data: []
  });
};

router.get('/health', healthCheck);

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);

router.use(auth);

router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.getMe);
router.get('/auth/profile', authController.getProfile);
router.post('/auth/change-password', authController.changePassword);

router.get('/users/me', userController.getMyInfo);
router.put('/users/me', userController.updateMyInfo);
router.get('/users/contacts', userController.getAllContacts);

router.get('/users', roleAuth('admin'), userController.listUsers);
router.post('/users', roleAuth('admin'), userController.createUser);
router.get('/users/stats', roleAuth('admin'), userController.getUserStats);
router.get('/users/:id', roleAuth('admin'), userController.getUser);
router.put('/users/:id', roleAuth('admin'), userController.updateUser);
router.delete('/users/:id', roleAuth('admin'), userController.deleteUser);
router.patch('/users/:id/toggle', roleAuth('admin'), userController.toggleUserActive);

router.get('/profile', userController.getMyInfo);
router.put('/profile', userController.updateMyInfo);

router.get('/dashboard/stats', userController.getDashboardStats);

router.get('/contacts', userController.getAllContacts);

router.get('/chat/list', chatController.getChatList);
router.get('/chat/history/:userId', chatController.getChatHistory);
router.post('/chat/send', chatController.sendMessage);
router.put('/chat/read/:userId', chatController.markAsRead);
router.get('/chat/unread', chatController.getUnreadCount);
router.get('/chat/admin/messages', chatController.getAllMessages);
router.get('/chat/admin/conversations', chatController.getAllConversations);

router.get('/social/posts', socialController.getPosts);
router.post('/social/posts', socialController.createPost);
router.get('/social/posts/:id', socialController.getPosts);
router.put('/social/posts/:id', placeholderHandler);
router.delete('/social/posts/:id', socialController.deletePost);
router.post('/social/posts/:id/like', socialController.toggleLike);
router.post('/social/posts/:id/comment', socialController.addComment);
router.get('/social/posts/test', socialController.testPosts);

router.get('/social/rooms/public', roomController.getPublicRooms);
router.get('/social/rooms/my', roomController.getMyRooms);
router.post('/social/rooms', roomController.createRoom);
router.get('/social/rooms/:id', roomController.getRoom);
router.put('/social/rooms/:id', placeholderHandler);
router.delete('/social/rooms/:id', roomController.deleteRoom);
router.post('/social/rooms/:id/join', roomController.joinRoom);
router.post('/social/rooms/:id/leave', roomController.leaveRoom);
router.get('/social/rooms/:id/members', roomController.getRoomMembers);
router.get('/social/rooms/:id/messages', roomController.getRoomMessages);
router.post('/social/rooms/:id/messages', roomController.sendRoomMessage);

router.get('/system/settings', roleAuth('admin'), systemController.getSettings);
router.put('/system/settings', roleAuth('admin'), systemController.updateSettings);
router.post('/system/backup', roleAuth('admin'), systemController.backupDatabase);

module.exports = router;
