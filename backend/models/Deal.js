const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema({
    store: { // Reference to the store this deal belongs to
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    user: { // Reference to the user (store staff/owner) who created/manages the deal
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: String,
        // Consider using an enum if you have predefined categories
        // enum: ['Bakery', 'Dairy', 'Produce', 'Meat', 'Pantry', 'Prepared'],
        required: [true, 'Category is required']
    },
    originalPrice: {
        type: Number,
        required: [true, 'Original price is required'],
        min: [0, 'Price cannot be negative']
    },
    discountedPrice: {
        type: Number,
        required: [true, 'Discounted price is required'],
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function(value) {
                // Ensure discounted price is not greater than original price
                return value <= this.originalPrice;
            },
            message: 'Discounted price cannot be greater than original price'
        }
    },
    quantityAvailable: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 1
    },
    bestBeforeDate: { // or sellByDate
        type: Date,
        required: [true, 'Best before date is required']
    },
    pickupInstructions: {
        type: String,
        required: [true, 'Pickup instructions are required']
    },
    imageURL: {
        type: String,
        // Consider adding validation for URL format
    },
    isActive: { // To easily toggle deal visibility
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update 'updatedAt' field before each save
DealSchema.pre('save', function(next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

// Optional: Add index for frequently queried fields
// DealSchema.index({ category: 1 });
// DealSchema.index({ store: 1, isActive: 1 });

module.exports = mongoose.model('Deal', DealSchema);
