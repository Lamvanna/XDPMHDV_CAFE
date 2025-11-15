const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin, isStaff } = require('../middleware/auth');

// Profile routes (authenticated)
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.post('/change-password', authenticate, userController.changePassword);
router.get('/stats', authenticate, userController.getUserStats);

// Admin/Staff routes (require authentication and admin/staff role)
router.get('/', authenticate, isStaff, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.post('/', authenticate, isAdmin, userController.createUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

module.exports = router;
