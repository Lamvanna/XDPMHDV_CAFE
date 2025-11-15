const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
    },
    location: {
        type: String,
        enum: ['indoor', 'outdoor', 'private'],
        default: 'indoor'
    },
    image: {
        type: String,
        default: '/assets/images/tables/default-table.jpg'
    },
    description: {
        type: String,
        default: ''
    },
    reservations: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        customerName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String
        },
        guests: {
            type: Number,
            required: true,
            min: 1
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // in minutes
            default: 120
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled'],
            default: 'pending'
        },
        notes: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
