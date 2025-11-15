const Order = require('../models/Order');

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const { status, orderType, limit = 50, sort = '-createdAt' } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (orderType) filter.orderType = orderType;
        
        const orders = await Order.find(filter)
            .populate('user', '-password')
            .populate('items.product')
            .populate('table')
            .sort(sort)
            .limit(parseInt(limit));
            
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get orders by user
exports.getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const currentUserId = req.user._id || req.user.id;
        
        // Check if user is accessing their own orders or is staff
        if (currentUserId.toString() !== userId && req.user.role !== 'staff' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const orders = await Order.find({ user: userId })
            .populate('items.product')
            .populate('table')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', '-password')
            .populate('items.product')
            .populate('table');
            
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const currentUserId = req.user._id || req.user.id;
        
        // Check if user is accessing their own order or is staff
        if (currentUserId.toString() !== order.user._id.toString() && 
            req.user.role !== 'staff' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const Promotion = require('../models/Promotion');
        const currentUserId = req.user._id || req.user.id;
        
        const orderData = {
            ...req.body,
            user: currentUserId
        };
        
        // Kiểm tra và xử lý khuyến mãi
        if (orderData.promotionCode) {
            const promotion = await Promotion.findOne({ 
                code: orderData.promotionCode.toUpperCase(),
                isActive: true
            });
            
            if (!promotion) {
                return res.status(400).json({ 
                    error: 'Mã khuyến mãi không hợp lệ' 
                });
            }
            
            // Kiểm tra thời gian
            const now = new Date();
            if (now < promotion.startDate || now > promotion.endDate) {
                return res.status(400).json({ 
                    error: 'Mã khuyến mãi đã hết hạn' 
                });
            }
            
            // Kiểm tra số lượt sử dụng
            if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
                return res.status(400).json({ 
                    error: 'Mã khuyến mãi đã hết lượt sử dụng' 
                });
            }
            
            // Tăng số lượt sử dụng
            promotion.usageCount += 1;
            await promotion.save();
        }
        
        // Check stock and update inventory
        if (orderData.items && orderData.items.length > 0) {
            for (const item of orderData.items) {
                const product = await Product.findById(item.product);
                
                if (!product) {
                    return res.status(404).json({ 
                        error: `Sản phẩm không tồn tại` 
                    });
                }
                
                if (!product.available) {
                    return res.status(400).json({ 
                        error: `Sản phẩm "${product.name}" hiện không có sẵn` 
                    });
                }
                
                if (product.stock < item.quantity) {
                    return res.status(400).json({ 
                        error: `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.stock}` 
                    });
                }
                
                // Trừ tồn kho
                product.stock -= item.quantity;
                await product.save();
            }
        }
        
        const order = new Order(orderData);
        await order.save();
        
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product')
            .populate('table');
            
        res.status(201).json({ success: true, order: populatedOrder });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update order
exports.updateOrder = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Check permissions:
        // - Staff/Admin can update any order
        // - Regular users can only cancel their own pending/confirmed orders
        const currentUserId = req.user._id || req.user.id;
        const isStaff = req.user.role === 'staff' || req.user.role === 'admin';
        const isOwner = order.user.toString() === currentUserId.toString();
        
        if (!isStaff && !isOwner) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // If user is not staff, only allow cancellation of pending/confirmed orders
        if (!isStaff) {
            if (req.body.status && req.body.status !== 'cancelled') {
                return res.status(403).json({ error: 'You can only cancel your orders' });
            }
            if (order.status !== 'pending' && order.status !== 'confirmed') {
                return res.status(400).json({ error: 'Can only cancel pending or confirmed orders' });
            }
        }
        
        // Hoàn trả tồn kho khi hủy đơn
        if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
            }
        }
        
        // Auto-update paymentStatus when order is completed
        const updateData = { ...req.body };
        if (updateData.status === 'completed' && !updateData.paymentStatus) {
            updateData.paymentStatus = 'paid';
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        )
        .populate('items.product')
        .populate('table');
        
        res.json({ success: true, order: updatedOrder });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Prepare update data
        const updateData = { status };
        
        // Auto-update paymentStatus when order is completed
        if (status === 'completed') {
            updateData.paymentStatus = 'paid';
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('items.product')
        .populate('table');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete order
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
