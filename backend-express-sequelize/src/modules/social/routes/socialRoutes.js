const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const roomController = require('../controllers/roomController');
const roomMessageController = require('../controllers/roomMessageController');
const { authenticate } = require('../../../middleware/auth');

// ==================== 说说/动态路由 ====================
router.get('/posts', authenticate, postController.getPosts);
router.post('/posts', authenticate, postController.createPost);
router.get('/posts/:id', authenticate, postController.getPost);
router.put('/posts/:id', authenticate, postController.updatePost);
router.delete('/posts/:id', authenticate, postController.deletePost);
router.post('/posts/:id/like', authenticate, postController.likePost);
router.post('/posts/:id/comment', authenticate, postController.commentPost);
router.get('/posts/:id/comments', authenticate, postController.getComments);
router.delete('/posts/:postId/comments/:commentId', authenticate, postController.deleteComment);

// ==================== 房间/圈子路由 ====================
router.get('/rooms/my', authenticate, roomController.getMyRooms);
router.get('/rooms/public', authenticate, roomController.getPublicRooms);
router.post('/rooms', authenticate, roomController.createRoom);
router.get('/rooms/:roomId', authenticate, roomController.getRoomDetail);
router.post('/rooms/:roomId/join', authenticate, roomController.joinRoom);
router.post('/rooms/join-by-code', authenticate, roomController.joinRoomByCode);
router.post('/rooms/:roomId/leave', authenticate, roomController.leaveRoom);
router.delete('/rooms/:roomId', authenticate, roomController.dissolveRoom);
router.put('/rooms/:roomId', authenticate, roomController.updateRoom);
router.post('/rooms/:roomId/refresh-code', authenticate, roomController.refreshInviteCode);

// ==================== 房间消息路由 ====================
router.get('/rooms/:roomId/messages', authenticate, roomMessageController.getRoomMessages);
router.post('/rooms/:roomId/messages', authenticate, roomMessageController.sendRoomMessage);

module.exports = router;
