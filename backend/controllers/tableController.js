const Table = require('../models/Table');
const Order = require('../models/Order');

// Get all tables
exports.getAllTables = async (req, res) => {
    try {
        const { status, location } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (location) filter.location = location;
        
        const tables = await Table.find(filter)
            .populate('reservations.user', '-password')
            .sort({ number: 1 });
            
        res.json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get available tables
exports.getAvailableTables = async (req, res) => {
    try {
        const { capacity, location } = req.query;
        
        let filter = { status: 'available' };
        if (capacity) filter.capacity = { $gte: parseInt(capacity) };
        if (location) filter.location = location;
        
        const tables = await Table.find(filter).sort({ number: 1 });
        
        res.json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get table by ID
exports.getTableById = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id)
            .populate('reservations.user', '-password');
            
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        res.json({ success: true, table });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get table by number
exports.getTableByNumber = async (req, res) => {
    try {
        const table = await Table.findOne({ number: req.params.number })
            .populate('reservations.user', '-password');
            
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        res.json({ success: true, table });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new table
exports.createTable = async (req, res) => {
    try {
        const table = new Table(req.body);
        await table.save();
        
        res.status(201).json({ success: true, table });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update table
exports.updateTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        res.json({ success: true, table });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update table status
exports.updateTableStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        res.json({ success: true, table });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Create reservation
exports.createReservation = async (req, res) => {
    try {
        // Support both :id and :tableId parameter names
        const tableId = req.params.id || req.params.tableId;
        const table = await Table.findById(tableId);
        
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        // Create reservation object with all fields from request
        const reservation = {
            user: req.user.id,
            userId: req.user.id,
            customerId: req.user.id,
            customerName: req.body.customerName,
            phone: req.body.phone,
            email: req.body.email,
            guests: req.body.guests,
            date: req.body.date,
            time: req.body.time,
            notes: req.body.notes,
            status: req.body.status || 'pending',
            duration: req.body.duration || 120
        };
        
        table.reservations.push(reservation);
        // Don't change table status when creating reservation
        // Status will be updated when reservation is confirmed/checked-in
        await table.save();
        
        const updatedTable = await Table.findById(table._id)
            .populate('reservations.user', '-password');
        
        res.status(201).json({ 
            success: true, 
            table: updatedTable,
            reservation: table.reservations[table.reservations.length - 1],
            message: 'Reservation created successfully' 
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Cancel reservation
exports.cancelReservation = async (req, res) => {
    try {
        const { tableId, reservationId } = req.params;
        
        console.log('🚫 Cancelling reservation:', { tableId, reservationId });
        
        const table = await Table.findById(tableId);
        
        if (!table) {
            return res.status(404).json({ 
                success: false,
                error: 'Table not found' 
            });
        }
        
        // Find the reservation
        const reservation = table.reservations.id(reservationId);
        
        if (!reservation) {
            return res.status(404).json({ 
                success: false,
                error: 'Reservation not found' 
            });
        }
        
        // Check if user owns this reservation OR is admin/staff
        const userId = req.user._id || req.user.id;
        const isStaffOrAdmin = req.user.role === 'admin' || req.user.role === 'staff';
        
        if (reservation.userId.toString() !== userId.toString() && !isStaffOrAdmin) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied' 
            });
        }
        
        // Check if reservation can be cancelled
        if (reservation.status === 'cancelled') {
            return res.status(400).json({ 
                success: false,
                error: 'Reservation is already cancelled' 
            });
        }
        
        if (reservation.status === 'completed') {
            return res.status(400).json({ 
                success: false,
                error: 'Cannot cancel completed reservation' 
            });
        }
        
        // Update status to cancelled instead of deleting
        reservation.status = 'cancelled';
        
        await table.save();
        
        console.log('✅ Reservation cancelled successfully');
        
        res.json({ 
            success: true,
            message: 'Reservation cancelled successfully',
            reservation: {
                _id: reservation._id,
                status: reservation.status
            }
        });
    } catch (error) {
        console.error('❌ Error cancelling reservation:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Get table's current order
exports.getTableOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            table: req.params.id,
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
        })
        .populate('items.product')
        .populate('user', '-password');
        
        if (!order) {
            return res.json({ 
                success: true, 
                order: null,
                message: 'No active order for this table' 
            });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user's reservations (history)
exports.getUserReservations = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        console.log('📋 Getting reservations for user:', userId);
        
        // Find all tables with reservations from this user
        const tables = await Table.find({
            'reservations.userId': userId
        }).select('number capacity location image reservations');
        
        // Extract and flatten user's reservations with table info
        const reservations = [];
        tables.forEach(table => {
            table.reservations.forEach(reservation => {
                if (reservation.userId && reservation.userId.toString() === userId.toString()) {
                    reservations.push({
                        _id: reservation._id,
                        tableId: table._id,
                        tableNumber: table.number,
                        tableCapacity: table.capacity,
                        tableLocation: table.location,
                        tableImage: table.image,
                        customerName: reservation.customerName,
                        phone: reservation.phone,
                        email: reservation.email,
                        guests: reservation.guests,
                        date: reservation.date,
                        time: reservation.time,
                        notes: reservation.notes,
                        status: reservation.status,
                        duration: reservation.duration,
                        createdAt: reservation.createdAt || reservation.date
                    });
                }
            });
        });
        
        // Sort by date descending (newest first)
        reservations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({ 
            success: true, 
            reservations,
            count: reservations.length 
        });
    } catch (error) {
        console.error('Error getting user reservations:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Get reservation detail
exports.getReservationDetail = async (req, res) => {
    try {
        const { tableId, reservationId } = req.params;
        
        console.log('📋 Getting reservation detail:', { tableId, reservationId });
        console.log('👤 User:', req.user);
        
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }
        
        const userId = req.user._id || req.user.id;
        
        const table = await Table.findById(tableId)
            .select('number capacity location image status reservations');
        
        if (!table) {
            return res.status(404).json({ 
                success: false,
                error: 'Table not found' 
            });
        }
        
        const reservation = table.reservations.id(reservationId);
        
        if (!reservation) {
            return res.status(404).json({ 
                success: false,
                error: 'Reservation not found' 
            });
        }
        
        // Check if user owns this reservation OR is admin/staff
        const isStaffOrAdmin = req.user.role === 'admin' || req.user.role === 'staff';
        
        if (reservation.userId.toString() !== userId.toString() && !isStaffOrAdmin) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied' 
            });
        }
        
        res.json({ 
            success: true, 
            reservation: {
                ...reservation.toObject(),
                table: {
                    _id: table._id,
                    number: table.number,
                    capacity: table.capacity,
                    location: table.location,
                    image: table.image,
                    status: table.status
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting reservation detail:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Delete table
exports.deleteTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);
        
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }
        
        res.json({ success: true, message: 'Table deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update reservation status
exports.updateReservationStatus = async (req, res) => {
    try {
        const { tableId, reservationId } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Must be: pending, confirmed, completed, or cancelled' 
            });
        }
        
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ 
                success: false, 
                message: 'Table not found' 
            });
        }
        
        const reservation = table.reservations.id(reservationId);
        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Reservation not found' 
            });
        }
        
        // Update reservation status
        reservation.status = status;
        
        // Auto-update table status based on reservation status
        if (status === 'confirmed') {
            table.status = 'reserved';
        } else if (status === 'completed') {
            table.status = 'occupied'; // Or 'available' depending on business logic
        } else if (status === 'cancelled') {
            // If this was the only active reservation, set table back to available
            const activeReservations = table.reservations.filter(r => 
                r._id.toString() !== reservationId && 
                (r.status === 'pending' || r.status === 'confirmed')
            );
            if (activeReservations.length === 0 && table.status === 'reserved') {
                table.status = 'available';
            }
        }
        
        await table.save();
        
        res.json({ 
            success: true, 
            message: `Reservation status updated to ${status}`,
            table,
            reservation
        });
    } catch (error) {
        console.error('❌ Error updating reservation status:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};
