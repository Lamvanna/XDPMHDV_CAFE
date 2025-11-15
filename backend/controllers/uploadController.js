const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../frontend/uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: logo-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, SVG, WebP)'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: fileFilter
});

// Upload logo endpoint
exports.uploadLogo = (req, res) => {
    upload.single('logo')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Multer error
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'File quá lớn. Kích thước tối đa 5MB' 
                });
            }
            return res.status(400).json({ 
                success: false, 
                error: err.message 
            });
        } else if (err) {
            // Other errors
            return res.status(400).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        // Success
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Không có file được upload' 
            });
        }
        
        // Return the URL path
        const logoUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Upload logo thành công',
            logoUrl: logoUrl,
            filename: req.file.filename
        });
    });
};

// Delete old logo
exports.deleteLogo = (req, res) => {
    try {
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({ 
                success: false, 
                error: 'Thiếu tên file' 
            });
        }
        
        const filePath = path.join(__dirname, '../../frontend/uploads', filename);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ 
                success: true, 
                message: 'Đã xóa logo cũ' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'File không tồn tại' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
