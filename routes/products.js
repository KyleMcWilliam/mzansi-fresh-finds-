const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProductReview,
} = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming authMiddleware is the correct name and path

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.route('/').get(getProducts);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.route('/:id').get(getProductById);

// @route   POST /api/products/:id/reviews
// @desc    Create a new review for a product
// @access  Private
router.route('/:id/reviews').post(authMiddleware, createProductReview); // Protected route

module.exports = router;
