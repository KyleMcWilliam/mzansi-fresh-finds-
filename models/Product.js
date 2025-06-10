const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = mongoose.Schema(
  {
    user: { // User who added the product (e.g., admin, store owner)
      type: mongoose.Schema.Types.ObjectId,
      // required: true, // Making it optional as per plan
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // URL to the image
      // required: true, // Making it optional for now, can be added if essential
    },
    brand: {
      type: String,
      // required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reviews: [reviewSchema],
    rating: { // Overall rating
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: { // Number of reviews
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
