const express = require('express');
const router = express.Router();
const { createStore, getStores, getStoreById, updateStore, deleteStore } = require('../controllers/storeController');
const authMiddleware = require('../middleware/authMiddleware'); // Renamed from auth.js in plan

// Public routes
router.get('/', getStores);
router.get('/:storeId', getStoreById);

// Private routes (require authentication)
router.post('/', authMiddleware, createStore);
router.put('/:storeId', authMiddleware, updateStore);
router.delete('/:storeId', authMiddleware, deleteStore);

module.exports = router;
