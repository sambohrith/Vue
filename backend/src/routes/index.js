/**
 * 路由统一入口
 * 按功能模块组织路由
 */

const express = require('express');
const router = express.Router();

// 导入各模块路由
const authRoutes = require('../modules/auth/routes/authRoutes');
const userRoutes = require('../modules/user/routes/userRoutes');
const profileRoutes = require('../modules/profile/routes/profileRoutes');
const chatRoutes = require('../modules/chat/routes/chatRoutes');
const socialRoutes = require('../modules/social/routes/socialRoutes');
const systemRoutes = require('../modules/system/routes/systemRoutes');

// API 路由挂载
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/chat', chatRoutes);
router.use('/social', socialRoutes);
router.use('/system', systemRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
