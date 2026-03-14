const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../../../middleware/auth');

// 需要管理员权限的路由
router.get('/admin/stats', authenticate, authorize('admin'), userController.getUserStats);
router.get('/admin/dashboard', authenticate, authorize('admin'), userController.getDashboardStats);
router.get('/admin', authenticate, authorize('admin'), userController.getUsers);
router.post('/admin', authenticate, authorize('admin'), userController.createUser);
router.get('/admin/:id', authenticate, authorize('admin'), userController.getUser);
router.put('/admin/:id', authenticate, authorize('admin'), userController.updateUser);
router.delete('/admin/:id', authenticate, authorize('admin'), userController.deleteUser);
router.patch('/admin/:id/status', authenticate, authorize('admin'), userController.updateUserStatus);

// 公开/普通用户路由
router.get('/contacts', authenticate, userController.getAllContacts);
router.get('/me', authenticate, userController.getMyInfo);
router.put('/me', authenticate, userController.updateMyInfo);

module.exports = router;
