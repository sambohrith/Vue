const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes/authRoutes');
const userRoutes = require('../modules/user/routes/userRoutes');
const profileRoutes = require('../modules/profile/routes/profileRoutes');
const chatRoutes = require('../modules/chat/routes/chatRoutes');
const socialRoutes = require('../modules/social/routes/socialRoutes');
const systemRoutes = require('../modules/system/routes/systemRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/chat', chatRoutes);
router.use('/social', socialRoutes);
router.use('/system', systemRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
