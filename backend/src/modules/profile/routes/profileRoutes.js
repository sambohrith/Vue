const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../../../middleware/auth');

// 个人资料管理
router.get('/me', authenticate, profileController.getProfile);
router.put('/me', authenticate, profileController.updateProfile);
router.put('/me/work', authenticate, profileController.updateWorkInfo);
router.put('/me/education', authenticate, profileController.updateEducationInfo);
router.put('/me/avatar', authenticate, profileController.updateAvatar);
router.put('/me/password', authenticate, profileController.updatePassword);

// 查看其他用户资料
router.get('/user/:userId', authenticate, profileController.getUserProfile);

module.exports = router;
