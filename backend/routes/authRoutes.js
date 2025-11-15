const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login - User login
router.post('/login', authController.login);

// POST /api/auth/register - User registration
router.post('/register', authController.register);

// POST /api/auth/logout - User logout
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user info (requires authentication)
router.get('/me', authenticate, authController.getCurrentUser);

// PUT /api/auth/change-password - Change password (requires authentication)
router.put('/change-password', authenticate, authController.changePassword);

// PUT /api/auth/profile - Update user profile (requires authentication)
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;
