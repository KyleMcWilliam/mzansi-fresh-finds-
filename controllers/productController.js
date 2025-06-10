const Product = require('../models/Product');
// const asyncHandler = require('../middleware/asyncHandler'); // Assuming you have an asyncHandler utility

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i', // Case insensitive
          },
        }
      : {};

    const products = await Product.find({ ...keyword });
    res.json(products);
  } catch (error) {
    console.error(`Error fetching products: ${error.message}`);
    res.status(500).json({ message: 'Server Error when fetching products' });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(`Error fetching product by ID: ${error.message}`);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID)' });
    }
    res.status(500).json({ message: 'Server Error when fetching product by ID' });
  }
};

// @desc    Create a new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // req.user should be available from authMiddleware
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }

      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        res.status(400).json({ message: 'Product already reviewed by this user' });
        return;
      }

      const review = {
        name: req.user.name, // Assuming user model has 'name'
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(`Error creating product review: ${error.message}`);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found (invalid ID for review)' });
    }
    res.status(500).json({ message: 'Server Error when creating review' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProductReview,
};
