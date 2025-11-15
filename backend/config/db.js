const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-system';

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`✅ Đã kết nối MongoDB`);
        return true;
    } catch (error) {
        console.error('❌ Lỗi kết nối database:', error.message);
        return false;
    }
};

module.exports = connectDB;
