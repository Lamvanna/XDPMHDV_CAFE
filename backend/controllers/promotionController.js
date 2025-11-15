const Promotion = require('../models/Promotion');

// Get all promotions
exports.getAllPromotions = async (req, res) => {
    try {
        const { isActive, includeExpired = false } = req.query;
        
        let filter = {};
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        
        if (!includeExpired) {
            filter.endDate = { $gte: new Date() };
        }
        
        const promotions = await Promotion.find(filter)
            .populate('applicableProducts')
            .sort({ createdAt: -1 });
            
        res.json({ success: true, promotions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get active promotions (public)
exports.getActivePromotions = async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
        .populate('applicableProducts')
        .sort({ createdAt: -1 });
        
        res.json({ success: true, promotions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get promotion by ID
exports.getPromotionById = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id)
            .populate('applicableProducts');
            
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        
        res.json({ success: true, promotion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Validate and get promotion by code
exports.validatePromotionCode = async (req, res) => {
    try {
        const { code, orderValue, orderAmount, productIds } = req.body;
        
        // Support both orderValue and orderAmount
        const orderTotal = orderValue || orderAmount || 0;
        
        if (!code) {
            return res.status(400).json({ 
                success: false,
                error: 'Promotion code is required' 
            });
        }
        
        const promotion = await Promotion.findOne({ 
            code: code.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        }).populate('applicableProducts');
        
        if (!promotion) {
            return res.status(404).json({ 
                success: false,
                error: 'Invalid or expired promotion code' 
            });
        }
        
        // Check usage limit
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
            return res.status(400).json({ 
                success: false,
                error: 'Promotion code has reached its usage limit' 
            });
        }
        
        // Check minimum order value
        const minOrderValue = promotion.minOrderValue || 0;
        if (orderTotal < minOrderValue) {
            return res.status(400).json({ 
                success: false,
                error: `Minimum order value of ${minOrderValue} required` 
            });
        }
        
        // Check applicable products (only if productIds provided and promotion has restrictions)
        if (promotion.applicableProducts && promotion.applicableProducts.length > 0) {
            // If no productIds provided, skip this check (apply to all products)
            if (productIds && productIds.length > 0) {
                const hasApplicableProduct = productIds.some(id => 
                    promotion.applicableProducts.some(p => p._id.toString() === id.toString())
                );
                
                if (!hasApplicableProduct) {
                    return res.status(400).json({ 
                        success: false,
                        error: 'Promotion not applicable to selected products' 
                    });
                }
            }
        }
        
        // Calculate discount
        let discount = 0;
        if (promotion.discountType === 'percentage') {
            discount = (orderTotal * promotion.discountValue) / 100;
            if (promotion.maxDiscount && discount > promotion.maxDiscount) {
                discount = promotion.maxDiscount;
            }
        } else {
            discount = promotion.discountValue;
        }
        
        res.json({ 
            success: true,
            valid: true,
            promotion: {
                _id: promotion._id,
                title: promotion.title,
                name: promotion.title,
                code: promotion.code,
                description: promotion.description,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                maxDiscount: promotion.maxDiscount,
                minOrderValue: promotion.minOrderValue,
                minOrderAmount: promotion.minOrderValue
            },
            discount: Math.round(discount * 100) / 100
        });
    } catch (error) {
        console.error('Validate promotion error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Create new promotion
exports.createPromotion = async (req, res) => {
    try {
        const promotion = new Promotion(req.body);
        await promotion.save();
        
        const populatedPromotion = await Promotion.findById(promotion._id)
            .populate('applicableProducts');
            
        res.status(201).json({ success: true, promotion: populatedPromotion });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('applicableProducts');
        
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        
        res.json({ success: true, promotion });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Increment promotion usage count
exports.incrementUsage = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            { $inc: { usageCount: 1 } },
            { new: true }
        );
        
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        
        res.json({ success: true, promotion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        
        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle promotion active status
exports.toggleActiveStatus = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        
        promotion.isActive = !promotion.isActive;
        await promotion.save();
        
        res.json({ success: true, promotion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
