const express = require('express');
const router = express.Router();
const { createDeal, getDeals, getDealById, updateDeal, deleteDeal } = require('../controllers/dealController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', getDeals);
router.get('/:dealId', getDealById);

// Private routes (require authentication)
router.post('/', authMiddleware, createDeal);
router.put('/:dealId', authMiddleware, updateDeal);
router.delete('/:dealId', authMiddleware, deleteDeal);

module.exports = router;
