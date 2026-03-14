const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../../../middleware/auth');
const { registerValidation, loginValidation, changePasswordValidation } = require('../../../middleware/validator');
const { strictLimiter } = require('../../../middleware/security');

// 公开路由
router.post('/register', strictLimiter, registerValidation, authController.register);
router.post('/login', strictLimiter, loginValidation, authController.login);

// 需要认证的路由
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);
router.post('/refresh-token', authenticate, authController.refreshToken);

module.exports = router;
