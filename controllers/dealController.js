const Deal = require('../models/Deal');
const Store = require('../models/Store'); // Needed for authorization checks

// @desc    Create a new deal for a store
// @route   POST /api/deals
// @access  Private
exports.createDeal = async (req, res) => {
    try {
        const { storeId, itemName, description, category, originalPrice, discountedPrice, quantityAvailable, bestBeforeDate, pickupInstructions, imageURL } = req.body;

        // Check if the store exists and if the authenticated user owns the store
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({ success: false, error: 'Store not found' });
        }
        if (store.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'User not authorized to add deals to this store' });
        }

        const deal = new Deal({
            store: storeId,
            user: req.user.id, // The authenticated user creating the deal
            itemName,
            description,
            category,
            originalPrice,
            discountedPrice,
            quantityAvailable,
            bestBeforeDate,
            pickupInstructions,
            imageURL
        });

        await deal.save();
        res.status(201).json({ success: true, data: deal });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all deals (with optional filtering)
// @route   GET /api/deals
// @access  Public
exports.getDeals = async (req, res) => {
    try {
        // Basic filtering examples (can be expanded)
        const { category, storeId, minPrice, maxPrice, active } = req.query;
        const query = {};

        if (category) query.category = category;
        if (storeId) query.store = storeId; // Assuming storeId is passed as a query param
        if (active) query.isActive = active === 'true'; else query.isActive = true; // Default to active deals

        if (minPrice || maxPrice) {
            query.discountedPrice = {};
            if (minPrice) query.discountedPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.discountedPrice.$lte = parseFloat(maxPrice);
        }

        // Only show deals where quantity is greater than 0
        query.quantityAvailable = { $gt: 0 };


        const deals = await Deal.find(query)
                                .populate('store', 'storeName address') // Populate store details
                                .populate('user', 'name'); // Populate user who created deal

        res.status(200).json({ success: true, count: deals.length, data: deals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get a single deal by ID
// @route   GET /api/deals/:dealId
// @access  Public
exports.getDealById = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.dealId)
                               .populate('store', 'storeName address contactInfo')
                               .populate('user', 'name');
        if (!deal || !deal.isActive || deal.quantityAvailable <= 0) { // Also check if deal is active and available
            return res.status(404).json({ success: false, error: 'Deal not found or no longer available' });
        }
        res.status(200).json({ success: true, data: deal });
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, error: 'Deal not found (invalid ID format)' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update a deal
// @route   PUT /api/deals/:dealId
// @access  Private
exports.updateDeal = async (req, res) => {
    try {
        let deal = await Deal.findById(req.params.dealId).populate('store'); // Populate store to check ownership

        if (!deal) {
            return res.status(404).json({ success: false, error: 'Deal not found' });
        }

        // Check if the authenticated user owns the store associated with the deal
        if (!deal.store || deal.store.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'User not authorized to update this deal' });
        }

        // Fields that can be updated
        const { itemName, description, category, originalPrice, discountedPrice, quantityAvailable, bestBeforeDate, pickupInstructions, imageURL, isActive } = req.body;

        const updateFields = {};
        if (itemName !== undefined) updateFields.itemName = itemName;
        if (description !== undefined) updateFields.description = description;
        if (category !== undefined) updateFields.category = category;
        if (originalPrice !== undefined) updateFields.originalPrice = originalPrice;
        if (discountedPrice !== undefined) updateFields.discountedPrice = discountedPrice;
        if (quantityAvailable !== undefined) updateFields.quantityAvailable = quantityAvailable;
        if (bestBeforeDate !== undefined) updateFields.bestBeforeDate = bestBeforeDate;
        if (pickupInstructions !== undefined) updateFields.pickupInstructions = pickupInstructions;
        if (imageURL !== undefined) updateFields.imageURL = imageURL;
        if (isActive !== undefined) updateFields.isActive = isActive;

        // Ensure discountedPrice is not greater than originalPrice if both are updated or one is updated
        if (updateFields.discountedPrice !== undefined && updateFields.originalPrice !== undefined) {
            if (updateFields.discountedPrice > updateFields.originalPrice) {
                return res.status(400).json({ success: false, error: 'Discounted price cannot be greater than original price.' });
            }
        } else if (updateFields.discountedPrice !== undefined && deal.originalPrice !== undefined) {
            if (updateFields.discountedPrice > deal.originalPrice) {
                 return res.status(400).json({ success: false, error: 'Discounted price cannot be greater than original price.' });
            }
        } else if (updateFields.originalPrice !== undefined && deal.discountedPrice !== undefined) {
             if (deal.discountedPrice > updateFields.originalPrice) {
                // This case might require a decision: adjust discountedPrice or error?
                // For now, let's assume this needs careful handling on the client or a specific business rule.
                // Alternatively, we could force updateFields.discountedPrice = updateFields.originalPrice if it becomes invalid.
             }
        }


        deal = await Deal.findByIdAndUpdate(req.params.dealId, { $set: updateFields }, { new: true, runValidators: true }).populate('store', 'storeName address');

        res.status(200).json({ success: true, data: deal });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, error: 'Deal not found (invalid ID format)' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete a deal
// @route   DELETE /api/deals/:dealId
// @access  Private
exports.deleteDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.dealId).populate('store');

        if (!deal) {
            return res.status(404).json({ success: false, error: 'Deal not found' });
        }

        // Check if the authenticated user owns the store associated with the deal
        if (!deal.store || deal.store.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'User not authorized to delete this deal' });
        }

        await deal.remove(); // or Deal.findByIdAndDelete(req.params.dealId);

        res.status(200).json({ success: true, data: { message: "Deal removed" } }); // Or 204 No Content
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, error: 'Deal not found (invalid ID format)' });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
