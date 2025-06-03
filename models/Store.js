const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
    user: { // Reference to the user who owns/created the store
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    storeName: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    latitude: {
        type: Number,
        // Consider adding validation for valid latitude range
    },
    longitude: {
        type: Number,
        // Consider adding validation for valid longitude range
    },
    contactInfo: { // Could be an email or phone number
        type: String,
    },
    openingHours: { // e.g., "Mon-Fri 9am-5pm, Sat 10am-2pm"
        type: String,
    },
    logoURL: {
        type: String,
        // Consider adding validation for URL format
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Add index for geospatial queries if you plan to use them often
// StoreSchema.index({ location: '2dsphere' }); // If storing lat/lon as a GeoJSON point

module.exports = mongoose.model('Store', StoreSchema);
