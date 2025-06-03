const Store = require('../models/Store');
const User = require('../models/User'); // Needed to associate store with user

// @desc    Create a new store
// @route   POST /api/stores
// @access  Private
exports.createStore = async (req, res) => {
    try {
        const { storeName, address, latitude, longitude, contactInfo, openingHours, logoURL } = req.body;
        // req.user.id is available from authMiddleware
        const store = new Store({
            user: req.user.id,
            storeName,
            address,
            latitude,
            longitude,
            contactInfo,
            openingHours,
            logoURL
        });

        await store.save();
        res.status(201).json({ success: true, data: store });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
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

        // Check if the logged-in user is the owner of the store
        if (store.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this store' });
        }

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

        // Check if the logged-in user is the owner of the store
        if (store.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this store' });
        }

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
