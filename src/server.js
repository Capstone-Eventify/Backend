const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Error handlers to catch crashes
process.on('uncaughtException', (error) => {
  console.error('FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  if (reason && reason.stack) console.error(reason.stack);
  process.exit(1);
});

// Initialize Prisma Client
const prisma = require('./lib/prisma');

// Import routes with error handling
let authRoutes, userRoutes, eventRoutes, ticketRoutes, ticketTierRoutes;
let paymentRoutes, analyticsRoutes, notificationRoutes, supportRoutes;
let supportTicketRoutes, organizerApplicationRoutes, socialRoutes;
let waitlistRoutes, favoritesRoutes, uploadRoutes;

try {
  authRoutes = require('./routes/auth');
  userRoutes = require('./routes/user');
  eventRoutes = require('./routes/events');
  ticketRoutes = require('./routes/tickets');
  ticketTierRoutes = require('./routes/ticketTiers');
  paymentRoutes = require('./routes/payments');
  analyticsRoutes = require('./routes/analytics');
  notificationRoutes = require('./routes/notifications');
  supportRoutes = require('./routes/support');
  supportTicketRoutes = require('./routes/supportTickets');
  organizerApplicationRoutes = require('./routes/organizerApplications');
  socialRoutes = require('./routes/social');
  waitlistRoutes = require('./routes/waitlist');
  favoritesRoutes = require('./routes/favorites');
  uploadRoutes = require('./routes/upload');
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman, Swagger UI)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3002', // Swagger UI docs server
      'http://localhost:5001', // Allow same-origin requests
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development (remove in production)
      // For production, use: callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Compression middleware
app.use(compression());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Eventify API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ticket-tiers', ticketTierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/organizer-applications', organizerApplicationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Prisma Client is initialized in lib/prisma.js

// Start server
const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid macOS AirPlay conflict
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces to allow external connections

try {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: Connected to PostgreSQL`);
    console.log(`💳 Stripe payments: Enabled`);
    console.log(`✅ Server started successfully!`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

module.exports = app;

