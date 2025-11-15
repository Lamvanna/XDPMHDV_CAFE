const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticate, isStaff, optionalAuth } = require('../middleware/auth');

// GET /api/tables - Get all tables (public with optional auth)
router.get('/', optionalAuth, tableController.getAllTables);

// GET /api/tables/available - Get available tables (public)
router.get('/available', tableController.getAvailableTables);

// GET /api/tables/user/reservations - Get user's reservation history (MUST BE BEFORE /:id)
router.get('/user/reservations', authenticate, tableController.getUserReservations);

// GET /api/tables/number/:number - Get table by number
router.get('/number/:number', tableController.getTableByNumber);

// GET /api/tables/:id - Get table by ID
router.get('/:id', tableController.getTableById);

// GET /api/tables/:id/order - Get table's current order (requires staff authentication)
router.get('/:id/order', authenticate, isStaff, tableController.getTableOrder);

// GET /api/tables/:tableId/reservations/:reservationId - Get reservation detail
router.get('/:tableId/reservations/:reservationId', authenticate, tableController.getReservationDetail);

// POST /api/tables - Create new table (requires staff authentication)
router.post('/', authenticate, isStaff, tableController.createTable);

// POST /api/tables/:id/reserve - Create reservation (requires authentication)
router.post('/:id/reserve', authenticate, tableController.createReservation);

// POST /api/tables/:tableId/reservations - Create reservation (alternative route)
router.post('/:tableId/reservations', authenticate, tableController.createReservation);

// PUT /api/tables/:id - Update table (requires staff authentication)
router.put('/:id', authenticate, isStaff, tableController.updateTable);

// PATCH /api/tables/:id/status - Update table status (requires staff authentication)
router.patch('/:id/status', authenticate, isStaff, tableController.updateTableStatus);

// PATCH /api/tables/:tableId/reservations/:reservationId/status - Update reservation status
router.patch('/:tableId/reservations/:reservationId/status', authenticate, isStaff, tableController.updateReservationStatus);

// DELETE /api/tables/:tableId/reservations/:reservationId - Cancel reservation
router.delete('/:tableId/reservations/:reservationId', authenticate, tableController.cancelReservation);

// DELETE /api/tables/:id - Delete table (requires staff authentication)
router.delete('/:id', authenticate, isStaff, tableController.deleteTable);

module.exports = router;
