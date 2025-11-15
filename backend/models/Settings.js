const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    shop: {
        name: {
            type: String,
            default: 'Coffee House'
        },
        logo: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            default: '123 Nguyễn Văn Linh, Quận 7, TP.HCM'
        },
        phone: {
            type: String,
            default: '0901234567'
        },
        email: {
            type: String,
            default: 'info@coffeehouse.vn'
        },
        description: {
            type: String,
            default: 'Cà phê ngon, không gian đẹp, phục vụ tận tâm'
        },
        website: {
            type: String,
            default: 'https://coffeehouse.vn'
        },
        facebook: {
            type: String,
            default: 'https://facebook.com/coffeehouse'
        },
        openTime: {
            type: String,
            default: '07:00'
        },
        closeTime: {
            type: String,
            default: '22:00'
        }
    },
    social: {
        facebook: String,
        instagram: String,
        twitter: String
    }
}, {
    timestamps: true
});

// Chỉ cho phép 1 document duy nhất
settingsSchema.statics.get = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
