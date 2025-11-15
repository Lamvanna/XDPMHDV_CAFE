const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate, isStaff } = require('../middleware/auth');

// GET /api/promotions/active - Get active promotions (public)
router.get('/active', promotionController.getActivePromotions);

// POST /api/promotions/validate - Validate promotion code (requires authentication)
router.post('/validate', authenticate, promotionController.validatePromotionCode);

// GET /api/promotions - Get all promotions (public for viewing, staff can see all including expired)
router.get('/', promotionController.getAllPromotions);

// GET /api/promotions/:id - Get promotion by ID (public)
router.get('/:id', promotionController.getPromotionById);

// POST /api/promotions - Create new promotion (requires staff authentication)
router.post('/', authenticate, isStaff, promotionController.createPromotion);

// PUT /api/promotions/:id - Update promotion (requires staff authentication)
router.put('/:id', authenticate, isStaff, promotionController.updatePromotion);

// PATCH /api/promotions/:id/toggle - Toggle active status (requires staff authentication)
router.patch('/:id/toggle', authenticate, isStaff, promotionController.toggleActiveStatus);

// PATCH /api/promotions/:id/usage - Increment usage count (internal use)
router.patch('/:id/usage', authenticate, promotionController.incrementUsage);

// DELETE /api/promotions/:id - Delete promotion (requires staff authentication)
router.delete('/:id', authenticate, isStaff, promotionController.deletePromotion);

module.exports = router;
