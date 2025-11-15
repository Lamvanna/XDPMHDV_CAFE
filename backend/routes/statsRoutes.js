const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate, isStaff } = require('../middleware/auth');

// All stats routes require staff authentication
router.use(authenticate);
router.use(isStaff);

// GET /api/stats/dashboard - Get dashboard overview
router.get('/dashboard', statsController.getDashboardStats);

// GET /api/stats/sales - Get sales statistics
router.get('/sales', statsController.getSalesStats);

// GET /api/stats/orders - Get order statistics
router.get('/orders', statsController.getOrderStats);

// GET /api/stats/popular-items - Get popular items
router.get('/popular-items', statsController.getPopularItems);

// GET /api/stats/top-products - Get top selling products (alias)
router.get('/top-products', statsController.getTopProducts);

// GET /api/stats/revenue - Get revenue statistics
router.get('/revenue', statsController.getRevenueStats);

// GET /api/stats/categories - Get category statistics
router.get('/categories', statsController.getCategoryStats);

// GET /api/stats/low-stock - Get low stock products
router.get('/low-stock', statsController.getLowStockProducts);

// GET /api/stats/customers - Get customer statistics
router.get('/customers', statsController.getCustomerStats);

// GET /api/stats/patterns - Get order patterns
router.get('/patterns', statsController.getOrderPatterns);

module.exports = router;
