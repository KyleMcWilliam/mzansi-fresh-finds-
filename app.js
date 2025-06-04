const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/config');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB - Moved to server.js for startup,
// but connection should be established before app is used for requests.
// For testing, test-helpers will manage its own connection.
// In a typical setup, app definition doesn't wait for DB connection here.

// Define a simple route (optional, can be removed if all routes are modular)
app.get('/', (req, res) => {
  res.send('API is running via app.js...');
});

// Use Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/deals', require('./routes/deals'));

// Custom Error Handling Middleware (should be after all routes)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

module.exports = app;
