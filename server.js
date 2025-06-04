const mongoose = require('mongoose');
const config = require('./config/config');
const app = require('./app'); // Import the Express app

// Startup Configuration Warnings
if (config.mongoURI === 'mongodb://localhost:27017/your-database-name') {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Default placeholder mongoURI detected in config/config.js. MongoDB may not connect or use an unintended database. Please update it.');
}
if (config.jwtSecret === 'your-jwt-secret') {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Default placeholder jwtSecret detected in config/config.js. This is insecure and should be changed for production. Please update it.');
}

// Connect to MongoDB
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: MongoDB connection failed.');
    console.error('Details:', err.message);
    if (err.name === 'MongoParseError' || err.message.includes('connect ECONNREFUSED')) {
        console.error('\x1b[36m%s\x1b[0m', 'Hint: Check if your MongoDB server is running and accessible.');
    }
    if (config.mongoURI === 'mongodb://localhost:27017/your-database-name') {
        console.error('\x1b[36m%s\x1b[0m', 'Hint: The mongoURI is still the default placeholder. Ensure it points to your actual MongoDB instance and database.');
    }
    // Consider exiting process if DB connection is critical for startup
    // process.exit(1);
  });

// Port
const PORT = process.env.PORT || 5000;

// Start server
// Ensure MongoDB is connected or at least connection attempt made before starting server
// (though mongoose buffers commands, so app can start)
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = server; // Export server for potential graceful shutdown in tests or other scripts
// For supertest, we only need the app, which is already correctly imported in test-helpers.js from app.js
// However, exporting server can be useful.
