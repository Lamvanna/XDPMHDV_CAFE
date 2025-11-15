const Contact = require('../models/Contact');

// Create new contact message (Public)
exports.createContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        // Get userId if user is logged in
        const userId = req.user ? req.user.id : null;
        
        const contact = new Contact({
            name,
            email,
            phone,
            subject: subject || 'Liên hệ chung',
            message,
            userId,
            status: 'new',
            priority: 'medium'
        });
        
        await contact.save();
        
        res.status(201).json({
            success: true,
            message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.',
            contact: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                createdAt: contact.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.'
        });
    }
};

// Get all contacts (Admin only)
exports.getAllContacts = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        
        const skip = (page - 1) * limit;
        
        const contacts = await Contact.find(filter)
            .populate('userId', 'name email phone')
            .populate('repliedBy', 'name email role')
            .populate('replies.repliedBy', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Contact.countDocuments(filter);
        
        res.json({
            success: true,
            contacts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get contact by ID (Admin or Owner)
exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('repliedBy', 'name email')
            .populate('replies.repliedBy', 'name email role');
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy tin nhắn'
            });
        }
        
        // Check if user is admin/staff or the owner of the contact
        const userRole = req.user.role;
        const isOwner = contact.userId && contact.userId._id.toString() === req.user.id;
        const isOwnerByEmail = contact.email === req.user.email;
        
        if (userRole !== 'admin' && userRole !== 'staff' && !isOwner && !isOwnerByEmail) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền xem tin nhắn này'
            });
        }
        
        // Mark as read if status is new (admin only)
        if (contact.status === 'new' && (userRole === 'admin' || userRole === 'staff')) {
            contact.status = 'read';
            await contact.save();
        }
        
        res.json({
            success: true,
            contact
        });
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update contact status (Admin only)
exports.updateContactStatus = async (req, res) => {
    try {
        const { status, priority } = req.body;
        
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy tin nhắn'
            });
        }
        
        if (status) contact.status = status;
        if (priority) contact.priority = priority;
        
        await contact.save();
        
        res.json({
            success: true,
            message: 'Đã cập nhật trạng thái',
            contact
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Reply to contact (Admin or Owner)
exports.replyContact = async (req, res) => {
    try {
        const { reply, message } = req.body;
        const replyMessage = reply || message; // Support both field names
        
        if (!replyMessage || !replyMessage.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Nội dung trả lời không được để trống'
            });
        }
        
        const contact = await Contact.findById(req.params.id)
            .populate('replies.repliedBy', 'name email role');
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy tin nhắn'
            });
        }
        
        // Check if user is admin/staff or the owner of the contact
        const userRole = req.user.role;
        const isOwner = contact.userId && contact.userId.toString() === req.user.id;
        const isOwnerByEmail = contact.email === req.user.email;
        
        if (userRole !== 'admin' && userRole !== 'staff' && !isOwner && !isOwnerByEmail) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền trả lời tin nhắn này'
            });
        }
        
        // Add new reply to replies array
        contact.replies.push({
            message: replyMessage.trim(),
            repliedBy: req.user.id,
            repliedAt: new Date()
        });
        
        // Update old fields for backward compatibility (admin only)
        if (userRole === 'admin' || userRole === 'staff') {
            contact.reply = replyMessage.trim();
            contact.repliedBy = req.user.id;
            contact.repliedAt = new Date();
            contact.status = 'replied';
        } else {
            // User reply - mark as in-progress if it was closed
            if (contact.status === 'closed') {
                contact.status = 'in-progress';
            }
        }
        
        await contact.save();
        
        // Populate the newly added reply
        await contact.populate('replies.repliedBy', 'name email role');
        
        console.log('✅ Reply added:', {
            contactId: contact._id,
            repliesCount: contact.replies.length,
            repliedBy: req.user.name
        });
        
        // TODO: Send email notification to user
        
        res.json({
            success: true,
            message: 'Đã gửi phản hồi',
            contact
        });
    } catch (error) {
        console.error('Error replying contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete contact (Admin only)
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy tin nhắn'
            });
        }
        
        res.json({
            success: true,
            message: 'Đã xóa tin nhắn'
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get contact statistics (Admin only)
exports.getContactStats = async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const priorityStats = await Contact.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const total = await Contact.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Contact.countDocuments({
            createdAt: { $gte: today }
        });
        
        res.json({
            success: true,
            stats: {
                total,
                today: todayCount,
                byStatus: stats,
                byPriority: priorityStats
            }
        });
    } catch (error) {
        console.error('Error fetching contact stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get current user's contacts (User)
exports.getMyContacts = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Vui lòng đăng nhập để xem tin nhắn'
            });
        }
        
        // Find contacts by userId OR by email if userId is not set
        const user = req.user;
        const contacts = await Contact.find({
            $or: [
                { userId: user.id },
                { email: user.email }
            ]
        })
            .populate('replies.repliedBy', 'name email role')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error fetching user contacts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
