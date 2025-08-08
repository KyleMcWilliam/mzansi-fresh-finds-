const express = require('express');
const router = express.Router();
// Update the destructuring to include getStoreProfilePage
// getStoreProfilePage is no longer used here as the route is defined in app.js
const { createStore, getStores, getStoreById, updateStore, deleteStore } = require('../controllers/storeController');
const authMiddleware = require('../middleware/authMiddleware'); // Renamed from auth.js in plan

// Note: The '/store/:slug' route is now defined directly in app.js
// to avoid complexities with router prefixing for page-serving routes vs. API routes.

// API Routes (typically prefixed with /api in app.js)
// Public API routes
router.get('/', getStores); // This would be for /api/stores
router.get('/:storeId', getStoreById); // This would be for /api/stores/:storeId

// Private API routes (require authentication)
router.post('/', authMiddleware, createStore); // For /api/stores
router.put('/:storeId', authMiddleware, updateStore); // For /api/stores/:storeId
router.delete('/:storeId', authMiddleware, deleteStore); // For /api/stores/:storeId

module.exports = router;
