const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Get dashboard statistics (overview)
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Today's statistics
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        const todayRevenue = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: today, $lt: tomorrow },
                    paymentStatus: 'paid'
                } 
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        // Yesterday's revenue for comparison
        const yesterdayRevenue = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: yesterday, $lt: today },
                    paymentStatus: 'paid'
                } 
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        // Calculate revenue change percentage
        const todayRev = todayRevenue[0]?.total || 0;
        const yesterdayRev = yesterdayRevenue[0]?.total || 0;
        const revenueChange = yesterdayRev > 0 
            ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 
            : 0;
        
        // New customers today
        const newCustomersToday = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // Total statistics
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ isAvailable: true });

        // Order status breakdown
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            today: {
                orders: todayOrders,
                revenue: todayRev,
                revenueChange: revenueChange,
                newCustomers: newCustomersToday
            },
            total: {
                orders: totalOrders,
                revenue: totalRevenue[0]?.total || 0,
                customers: totalCustomers,
                products: totalProducts,
                activeProducts: activeProducts
            },
            ordersByStatus
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
    try {
        const { startDate, endDate, period = 'daily' } = req.query;
        
        let matchCondition = { paymentStatus: 'paid' };
        if (startDate || endDate) {
            matchCondition.createdAt = {};
            if (startDate) matchCondition.createdAt.$gte = new Date(startDate);
            if (endDate) matchCondition.createdAt.$lte = new Date(endDate);
        }

        // Format based on period
        let dateFormat;
        switch(period) {
            case 'monthly':
                dateFormat = '%Y-%m';
                break;
            case 'yearly':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        const sales = await Order.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    totalSales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } },
            { $sort: { count: -1 } }
        ]);
        
        const orderTypeStats = await Order.aggregate([
            { $group: { _id: '$orderType', count: { $sum: 1 } } }
        ]);

        const paymentStats = await Order.aggregate([
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$total' } } }
        ]);

        res.json({ 
            success: true,
            statusStats: stats,
            orderTypeStats,
            paymentStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get popular items
exports.getPopularItems = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const popularItems = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'ready', 'preparing'] } } },
            { $unwind: '$items' },
            { 
                $group: { 
                    _id: '$items.product', 
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    orderCount: { $sum: 1 }
                } 
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: parseInt(limit) },
            { 
                $lookup: { 
                    from: 'products', 
                    localField: '_id', 
                    foreignField: '_id', 
                    as: 'product' 
                } 
            },
            { $unwind: '$product' },
            {
                $project: {
                    product: 1,
                    totalQuantity: 1,
                    totalRevenue: 1,
                    orderCount: 1
                }
            }
        ]);
        
        res.json({ success: true, popularItems });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get revenue statistics
exports.getRevenueStats = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const revenue = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate },
                    paymentStatus: 'paid'
                } 
            },
            { 
                $group: { 
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, 
                    totalSales: { $sum: '$total' },
                    orderCount: { $sum: 1 }
                } 
            },
            { $sort: { '_id': 1 } }
        ]);
        
        res.json({ success: true, sales: revenue });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get top selling products (formatted for dashboard)
exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const topProducts = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'ready', 'preparing'] } } },
            { $unwind: '$items' },
            { 
                $group: { 
                    _id: '$items.product', 
                    soldCount: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                } 
            },
            { $sort: { soldCount: -1 } },
            { $limit: parseInt(limit) },
            { 
                $lookup: { 
                    from: 'products', 
                    localField: '_id', 
                    foreignField: '_id', 
                    as: 'productInfo' 
                } 
            },
            { $unwind: '$productInfo' },
            {
                $project: {
                    _id: '$productInfo._id',
                    name: '$productInfo.name',
                    category: '$productInfo.category',
                    price: '$productInfo.price',
                    soldCount: 1,
                    totalRevenue: 1
                }
            }
        ]);
        
        res.json({ success: true, products: topProducts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get product category statistics
exports.getCategoryStats = async (req, res) => {
    try {
        const categoryStats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    avgPrice: { $avg: '$price' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({ success: true, categoryStats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;
        
        const lowStockProducts = await Product.find({
            stock: { $lte: parseInt(threshold) }
        }).sort({ stock: 1 });

        res.json({ success: true, lowStockProducts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        
        // Top customers by order count
        const topCustomers = await Order.aggregate([
            {
                $group: {
                    _id: '$user',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$total' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    'customer.password': 0
                }
            }
        ]);

        res.json({ 
            success: true, 
            totalCustomers,
            topCustomers 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get time-based order patterns
exports.getOrderPatterns = async (req, res) => {
    try {
        // Orders by hour of day
        const hourlyPattern = await Order.aggregate([
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Orders by day of week
        const weeklyPattern = await Order.aggregate([
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ 
            success: true, 
            hourlyPattern,
            weeklyPattern 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

