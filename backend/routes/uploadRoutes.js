const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Upload logo - Admin only
router.post('/logo', authenticate, isAdmin, uploadController.uploadLogo);

// Delete logo - Admin only
router.delete('/logo', authenticate, isAdmin, uploadController.deleteLogo);

module.exports = router;
