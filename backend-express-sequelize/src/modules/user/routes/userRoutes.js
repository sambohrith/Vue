const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../../../middleware/auth');
const { validateUserUpdate, validateProfileUpdate, validatePagination } = require('../../../middleware/validator');

router.get('/admin/stats', authenticate, authorize('admin'), userController.getUserStats);
router.get('/admin/dashboard', authenticate, authorize('admin'), userController.getDashboardStats);
router.get('/admin', authenticate, authorize('admin'), validatePagination, userController.getUsers);
router.post('/admin', authenticate, authorize('admin'), validateUserUpdate, userController.createUser);
router.get('/admin/:id', authenticate, authorize('admin'), userController.getUser);
router.put('/admin/:id', authenticate, authorize('admin'), validateUserUpdate, userController.updateUser);
router.delete('/admin/:id', authenticate, authorize('admin'), userController.deleteUser);
router.patch('/admin/:id/toggle-active', authenticate, authorize('admin'), userController.toggleUserActive);

router.get('/contacts', authenticate, userController.getAllContacts);
router.get('/me', authenticate, userController.getMyInfo);
router.put('/me', authenticate, validateProfileUpdate, userController.updateMyInfo);

module.exports = router;
