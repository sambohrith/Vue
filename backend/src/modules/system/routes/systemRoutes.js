const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../../../middleware/auth');

// 获取系统设置（需要登录）
router.get('/settings', authenticate, settingsController.getSettings);

// 管理员功能
router.put('/settings', authenticate, authorize('admin'), settingsController.updateSettings);
router.post('/backup', authenticate, authorize('admin'), settingsController.backupDatabase);
router.post('/restore', authenticate, authorize('admin'), settingsController.restoreDatabase);
router.get('/database-size', authenticate, authorize('admin'), settingsController.getDatabaseSize);
router.get('/logs', authenticate, authorize('admin'), settingsController.getSystemLogs);
router.post('/clear-cache', authenticate, authorize('admin'), settingsController.clearCache);

module.exports = router;
