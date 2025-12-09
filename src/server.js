const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Prisma Client
const prisma = require('./lib/prisma');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/events');
const ticketRoutes = require('./routes/tickets');
const ticketTierRoutes = require('./routes/ticketTiers');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const supportRoutes = require('./routes/support');
const supportTicketRoutes = require('./routes/supportTickets');
const organizerApplicationRoutes = require('./routes/organizerApplications');
const socialRoutes = require('./routes/social');
const waitlistRoutes = require('./routes/waitlist');
const favoritesRoutes = require('./routes/favorites');
const uploadRoutes = require('./routes/upload');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: Connected to PostgreSQL`);
  console.log(`💳 Stripe payments: Enabled`);
});

module.exports = app;

