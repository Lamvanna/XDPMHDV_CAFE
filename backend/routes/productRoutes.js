const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isStaff } = require('../middleware/auth');

// GET /api/products - Get all products (public)
router.get('/', productController.getAllProducts);

// GET /api/products/category/:category - Get products by category (public)
router.get('/category/:category', productController.getProductsByCategory);

// GET /api/products/:id - Get product by ID (public)
router.get('/:id', productController.getProductById);

// POST /api/products - Create new product (requires staff authentication)
router.post('/', authenticate, isStaff, productController.createProduct);

// PUT /api/products/:id - Update product (requires staff authentication)
router.put('/:id', authenticate, isStaff, productController.updateProduct);

// PATCH /api/products/:id/stock - Update product stock (requires staff authentication)
router.patch('/:id/stock', authenticate, isStaff, productController.updateStock);

// DELETE /api/products/:id - Delete product (requires staff authentication)
router.delete('/:id', authenticate, isStaff, productController.deleteProduct);

module.exports = router;
