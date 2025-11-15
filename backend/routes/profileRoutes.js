const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// GET /api/profile - Get user profile
router.get('/', authenticate, profileController.getProfile);

// PUT /api/profile - Update user profile
router.put('/', authenticate, profileController.updateProfile);

// POST /api/profile/change-password - Change password
router.post('/change-password', authenticate, profileController.changePassword);

// POST /api/profile/avatar - Upload avatar
router.post('/avatar', authenticate, upload.single('avatar'), profileController.uploadAvatar);

// GET /api/profile/stats - Get user statistics
router.get('/stats', authenticate, profileController.getUserStats);

module.exports = router;
