const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../../../middleware/auth');
const { validateLogin, validateRegister } = require('../../../middleware/validator');

router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
