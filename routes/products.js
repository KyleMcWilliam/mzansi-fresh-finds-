const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationMiddleware');
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
router
  .route('/:id/reviews')
  .post(
    authMiddleware, // Assuming this is the existing auth middleware
    [ // Validation rules
      body('rating', 'Rating must be a number').isNumeric(),
      body('comment', 'Comment cannot be empty').not().isEmpty(),
    ],
    validateRequest, // Middleware to check for errors
    createProductReview // Your controller
  );

module.exports = router;
