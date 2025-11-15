const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, isStaff } = require('../middleware/auth');

// Public route - Create contact message
router.post('/', contactController.createContact);

// User routes - Authenticated users (must be before /:id)
router.get('/my-messages', authenticate, contactController.getMyContacts);

// Admin-only routes (must be before /:id to avoid conflicts)
router.get('/stats', authenticate, isStaff, contactController.getContactStats);

// Shared routes - Both admin and owner can access
router.get('/:id', authenticate, contactController.getContactById); // Both admin and owner can view
router.post('/:id/reply', authenticate, contactController.replyContact); // Both admin and owner can reply

// Admin-only routes
router.get('/', authenticate, isStaff, contactController.getAllContacts);
router.patch('/:id/status', authenticate, isStaff, contactController.updateContactStatus);
router.delete('/:id', authenticate, isStaff, contactController.deleteContact);

module.exports = router;
