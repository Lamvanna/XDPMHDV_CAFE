const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            dateOfBirth,
            address,
            gender,
            favoriteDrink,
            emailNotifications,
            smsNotifications,
            birthdayNotifications
        } = req.body;
        
        // Check if email is already taken by another user
        if (email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: req.user.id } 
            });
            
            if (existingUser) {
                return res.status(400).json({ error: 'Email đã được sử dụng' });
            }
        }
        
        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                email,
                phone,
                dateOfBirth,
                address,
                gender,
                favoriteDrink,
                emailNotifications,
                smsNotifications,
                birthdayNotifications
            },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Mật khẩu mới không khớp' });
        }
        
        // Check password length
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        
        // Get user with password
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatarUrl },
            { new: true }
        ).select('-password');
        
        res.json({ success: true, user, avatarUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const Table = require('../models/Table');
        
        // Count orders
        const totalOrders = await Order.countDocuments({ 
            user: req.user.id,
            status: { $ne: 'cancelled' }
        });
        
        // Count reservations
        const tables = await Table.find({
            'reservations.user': req.user.id
        });
        
        let totalReservations = 0;
        tables.forEach(table => {
            totalReservations += table.reservations.filter(
                r => r.user.toString() === req.user.id.toString()
            ).length;
        });
        
        // Get user points (if you have a points system)
        const user = await User.findById(req.user.id);
        const totalPoints = user.points || 0;
        
        res.json({
            success: true,
            stats: {
                totalOrders,
                totalReservations,
                totalPoints
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
