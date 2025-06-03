const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/config');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define a simple route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Use Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/deals', require('./routes/deals'));

// Custom Error Handling Middleware (should be after all routes)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack || err); // Log the full error stack for debugging

  // If the error has a status code, use it, otherwise default to 500
  const statusCode = err.statusCode || 500;
  // If the error has a message, use it, otherwise a generic message
  const message = err.message || 'Internal Server Error';

  // Avoid sending error details in production for non-operational errors
  // For now, we send the message. In a production app, you might want to be more careful.
  res.status(statusCode).json({
    success: false,
    error: message,
    // Optionally, include stack in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
