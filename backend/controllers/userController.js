const User = require('../models/User');
const Order = require('../models/Order');

// Get all users with order statistics
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        // Get order statistics for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const userObj = user.toObject();
            
            // Get orders for this user
            const orders = await Order.find({ 
                user: user._id,
                status: { $ne: 'cancelled' }
            });
            
            userObj.orderCount = orders.length;
            userObj.totalSpent = orders.reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);
            
            return userObj;
        }));
        
        res.json({ 
            success: true, 
            data: usersWithStats,
            count: usersWithStats.length 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new user
exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        res.status(201).json({ 
            success: true, 
            data: userObj,
            message: 'User created successfully' 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        res.json({ 
            success: true, 
            data: user,
            message: 'User updated successfully' 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        res.json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address, birthday, gender, avatar } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (birthday) user.birthday = birthday;
        if (gender) user.gender = gender;
        if (avatar) user.avatar = avatar;
        
        await user.save();
        
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json({ user: updatedUser, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const Order = require('../models/Order');
        
        const orders = await Order.countDocuments({ userId: req.user.id });
        const reservations = 0; // TODO: Add reservation model
        const points = 0; // TODO: Add points calculation
        
        res.json({ orders, reservations, points });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
