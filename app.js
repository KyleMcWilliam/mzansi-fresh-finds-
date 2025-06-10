const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/config');
const path = require('path'); // Added
const storeController = require('./controllers/storeController'); // Added

// Initialize Express app
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Explicitly set views directory

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Added

// Static files serving
// Serve files directly from root (e.g., style.css, manifest.json)
// Also allows access to /css, /js, /images as subdirectories of root
app.use(express.static(path.join(__dirname, ''))); // Serves from project root


// Page route (defined directly in app.js)
app.get('/store/:slug', storeController.getStoreProfilePage);

// Basic route for home page
app.get('/', (req, res) => {
    // Check if index.html exists, otherwise send a simple message or 404
    // For now, assume index.html is present in the root.
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores')); // This router should only contain API endpoints
app.use('/api/deals', require('./routes/deals'));
app.use('/api/products', require('./routes/products'));

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
