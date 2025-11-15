const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    code: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    minOrderValue: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscount: {
        type: Number,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        min: 0
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Virtual để sync title với name (backward compatibility)
promotionSchema.pre('save', function(next) {
    if (!this.title && this.name) {
        this.title = this.name;
    }
    if (!this.name && this.title) {
        this.name = this.title;
    }
    next();
});

module.exports = mongoose.model('Promotion', promotionSchema);
