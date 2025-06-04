const Store = require('../models/Store');
const User = require('../models/User'); // Needed to associate store with user
const Deal = require('../models/Deal');

// Simple slugify function (can be placed here or imported)
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// @desc    Create a new store
// @route   POST /api/stores
// @access  Private
exports.createStore = async (req, res) => {
    try {
        const { storeName, address, latitude, longitude, contactInfo, openingHours, logoURL } = req.body;

        if (!storeName) { // Should be caught by model validation, but good to check
            return res.status(400).json({ success: false, error: 'Store name is required to generate a slug.' });
        }
        const slug = slugify(storeName);
        // Potentially add a check here if slug is empty after slugify, though model will catch required
        if (!slug) {
             // This case should ideally not happen if storeName is valid
            return res.status(400).json({ success: false, error: 'Could not generate a valid slug from the store name.' });
        }


        // req.user.id is available from authMiddleware
        const store = new Store({
            user: req.user.id,
            storeName,
            slug, // Add the generated slug
            address,
            // For location, ensure it's derived from latitude and longitude correctly
            // Assuming latitude and longitude are provided and are valid numbers
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            contactInfo,
            openingHours,
            logoURL
        });

        await store.save();
        res.status(201).json({ success: true, data: store });
    } catch (error) {
        console.error(error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) { // Handle duplicate slug error
            return res.status(400).json({ success: false, error: 'Store name or slug already exists. Please choose a different name.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Display single store profile page
// @route   GET /store/:slug
// @access  Public
exports.getStoreProfilePage = async (req, res) => {
    try {
        const storeSlug = req.params.slug;
        const store = await Store.findOne({ slug: storeSlug }); // .populate('user', 'name'); // Optional: if user info is needed on store page

        if (!store) {
            // Option 1: Send 404 status and a simple message (or JSON)
            return res.status(404).send('Store not found');
            // Option 2: Render a 404.ejs page if you have one
            // return res.status(404).render('404', { title: 'Page Not Found' });
        }

        const deals = await Deal.find({
            store: store._id,
            isActive: true,
            quantityAvailable: { $gt: 0 }
        }).sort({ bestBeforeDate: 1 }); // Optional: sort deals, e.g., by expiry

        res.render('store-profile', { // Assumes 'store-profile.ejs' is in the 'views' directory
            store: store,
            deals: deals,
            title: `${store.storeName} Profile` // Optional: pass a title to the template
        });

    } catch (error) {
        console.error('Error in getStoreProfilePage:', error);
        // Handle different types of errors if necessary
        if (error.kind === 'ObjectId' && error.path === '_id') { // Unlikely here as we query by slug
             return res.status(404).send('Invalid store identifier format.');
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
exports.getStores = async (req, res) => {
    try {
        const stores = await Store.find().populate('user', 'name email'); // Populate user with name and email
        res.status(200).json({ success: true, count: stores.length, data: stores });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get a single store by ID
// @route   GET /api/stores/:storeId
// @access  Public
exports.getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId).populate('user', 'name email');
        if (!store) {
            return res.status(404).json({ success: false, error: 'Store not found' });
        }
        res.status(200).json({ success: true, data: store });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, error: 'Store not found (invalid ID format)' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update a store
// @route   PUT /api/stores/:storeId
// @access  Private
exports.updateStore = async (req, res) => {
    try {
        let store = await Store.findById(req.params.storeId);

        if (!store) {
            return res.status(404).json({ success: false, error: 'Store not found' });
        }

        // Admin check: Admins can update any store, others must own the store.
        if (req.user.role !== 'admin') {
            if (store.user.toString() !== req.user.id) {
                return res.status(401).json({ success: false, error: 'Not authorized to update this store' });
            }
        }
        // If admin, ownership check is bypassed.

        // Fields to update
        const { storeName, address, latitude, longitude, contactInfo, openingHours, logoURL } = req.body;
        const updateFields = {};
        if (storeName) updateFields.storeName = storeName;
        if (address) updateFields.address = address;
        if (latitude) updateFields.latitude = latitude;
        if (longitude) updateFields.longitude = longitude;
        if (contactInfo) updateFields.contactInfo = contactInfo;
        if (openingHours) updateFields.openingHours = openingHours;
        if (logoURL) updateFields.logoURL = logoURL;


        store = await Store.findByIdAndUpdate(req.params.storeId, { $set: updateFields }, { new: true, runValidators: true });

        res.status(200).json({ success: true, data: store });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, error: 'Store not found (invalid ID format)' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete a store
// @route   DELETE /api/stores/:storeId
// @access  Private
exports.deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);

        if (!store) {
            return res.status(404).json({ success: false, error: 'Store not found' });
        }

        // Admin check: Admins can delete any store, others must own the store.
        if (req.user.role !== 'admin') {
            if (store.user.toString() !== req.user.id) {
                return res.status(401).json({ success: false, error: 'Not authorized to delete this store' });
            }
        }
        // If admin, ownership check is bypassed.

        // Optional: Add logic here to handle deals associated with the store.
        // For now, we'll just delete the store.
        // await Deal.deleteMany({ store: req.params.storeId });

        await store.remove(); // or Store.findByIdAndDelete(req.params.storeId);

        res.status(200).json({ success: true, data: {} }); // Or 204 No Content
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, error: 'Store not found (invalid ID format)' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
