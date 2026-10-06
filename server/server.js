const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const { testConnection } = require('./config/db');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Enable Cross-Origin Resource Sharing so React frontend can communicate with API
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded product images from the local /uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// API ROUTES
// ============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Local Artisan Marketplace API',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular feature routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Not Found handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  // Multer file upload specific errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

const startServer = async () => {
  // Test connection to PostgreSQL before opening HTTP port
  await testConnection();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Artisan Marketplace API running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🖼️  Image uploads served at: http://localhost:${PORT}/uploads/`);
    console.log(`=======================================================`);
  });
};

startServer();

module.exports = app;
