require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());

// Conditionally parse JSON bodies for all routes EXCEPT the stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhook')) {
    next(); // Skip global JSON parsing so express.raw() in the route can process it
  } else {
    express.json()(req, res, next);
  }
});

const errorHandler = require('./middlewares/errorHandler');

// Routes
app.use('/api/payments', paymentRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing connections...');
  
  try {
    await pool.end();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

module.exports = server;