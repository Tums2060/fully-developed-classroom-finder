const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public login
router.post('/login', authController.login);

// Token validation
router.get('/verify', authenticateToken, authController.verify);

// Self password change
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
