const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, isStaff } = require('../middleware/auth');

// GET /api/orders - Get all orders (requires staff authentication)
router.get('/', authenticate, isStaff, orderController.getAllOrders);

// GET /api/orders/user/:userId - Get orders by user ID
router.get('/user/:userId', authenticate, orderController.getOrdersByUser);

// GET /api/orders/:id - Get order by ID (requires authentication)
router.get('/:id', authenticate, orderController.getOrderById);

// POST /api/orders - Create new order (requires authentication)
router.post('/', authenticate, orderController.createOrder);

// PUT /api/orders/:id - Update order (requires authentication, staff can update all, users can cancel their own)
router.put('/:id', authenticate, orderController.updateOrder);

// PATCH /api/orders/:id/status - Update order status (requires staff authentication)
router.patch('/:id/status', authenticate, isStaff, orderController.updateOrderStatus);

// DELETE /api/orders/:id - Delete order (requires staff authentication)
router.delete('/:id', authenticate, isStaff, orderController.deleteOrder);

module.exports = router;
