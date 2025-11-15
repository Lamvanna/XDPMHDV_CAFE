const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
    );
};

// Register new user
exports.register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone, role } = req.body;
        
        console.log('📝 Registration request:', { username, email, firstName, lastName, phone });

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        console.log('🔍 Email check:', email, '- Exists:', !!existingEmail);
        if (existingEmail) {
            return res.status(400).json({ 
                error: 'Email already exists',
                message: 'Email này đã được đăng ký'
            });
        }
        
        const existingUsername = await User.findOne({ username });
        console.log('🔍 Username check:', username, '- Exists:', !!existingUsername);
        if (existingUsername) {
            console.log('❌ Username conflict detected');
            return res.status(400).json({ 
                error: 'Username already exists',
                message: 'Tên đăng nhập này đã tồn tại'
            });
        }
        
        console.log('✅ No conflicts, creating user...');
        // Create new user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            role: role || 'customer'
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Please provide email and password' 
            });
        }

        // Find user by email only
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Logout (client-side mainly, but can be used for token blacklisting)
exports.logout = async (req, res) => {
    try {
        // In a stateless JWT implementation, logout is handled client-side
        // by removing the token. This endpoint can be used for logging purposes
        // or implementing token blacklisting if needed
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Please provide current and new password' 
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, phone, address } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, phone, address },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
