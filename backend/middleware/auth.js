const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        console.log('🔐 Auth check:', {
            hasHeader: !!authHeader,
            headerValue: authHeader?.substring(0, 20) + '...'
        });
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No token or invalid format');
            return res.status(401).json({ 
                error: 'No token provided. Authorization denied.' 
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('🎫 Token extracted, length:', token.length);

        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );
        
        console.log('✅ Token verified, user ID:', decoded.id);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            console.log('❌ User not found:', decoded.id);
            return res.status(401).json({ 
                error: 'User not found. Authorization denied.' 
            });
        }
        
        console.log('✅ User found:', user.username, '- Role:', user.role);

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(500).json({ error: 'Server error in authentication' });
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            error: 'Access denied. Admin privileges required.' 
        });
    }
};

// Check if user is staff or admin
exports.isStaff = (req, res, next) => {
    if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ 
            error: 'Access denied. Staff privileges required.' 
        });
    }
};

// Check if user is the owner of the resource or admin
exports.isOwnerOrAdmin = (resourceUserIdField = 'user') => {
    return (req, res, next) => {
        const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
        
        if (req.user && 
            (req.user.role === 'admin' || 
             req.user._id.toString() === resourceUserId?.toString())) {
            next();
        } else {
            res.status(403).json({ 
                error: 'Access denied. You can only access your own resources.' 
            });
        }
    };
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'your-secret-key-change-in-production'
            );
            const user = await User.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
