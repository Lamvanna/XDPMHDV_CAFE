require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

// Handle uncaught exceptions FIRST
process.on('uncaughtException', (err, origin) => {
    console.error('❌ Uncaught Exception:');
    console.error('Error:', err);
    console.error('Origin:', origin);
    console.error('Stack:', err.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Promise Rejection:');
    console.error('Error:', err);
    console.error('Promise:', promise);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database (async but non-blocking)
connectDB();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('frontend/uploads'));

// Routes
try {
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/products', require('./routes/productRoutes'));
    app.use('/api/orders', require('./routes/orderRoutes'));
    app.use('/api/users', require('./routes/userRoutes'));
    app.use('/api/tables', require('./routes/tableRoutes'));
    app.use('/api/stats', require('./routes/statsRoutes'));
    app.use('/api/promotions', require('./routes/promotionRoutes'));
    app.use('/api/profile', require('./routes/profileRoutes'));
    app.use('/api/contacts', require('./routes/contactRoutes'));
    app.use('/api/settings', require('./routes/settingsRoutes'));
    app.use('/api/upload', require('./routes/uploadRoutes'));
} catch (error) {
    console.error('❌ Lỗi tải routes:', error);
    process.exit(1);
}

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Coffee System API' });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('❌ Error handler caught:', err);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server đã khởi động: http://localhost:${PORT}\n`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('❌ Lỗi server:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} đang được sử dụng`);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
