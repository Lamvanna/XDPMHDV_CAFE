const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public route - anyone can view settings
router.get('/', settingsController.getSettings);

// Admin only - update settings
router.put('/', authenticate, isAdmin, settingsController.updateSettings);

module.exports = router;
