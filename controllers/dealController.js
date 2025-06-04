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

        // Admin check: Admins can create deals for any store, others must own the store.
        if (req.user.role !== 'admin') {
            if (store.user.toString() !== req.user.id) {
                return res.status(403).json({ success: false, error: 'User not authorized to add deals to this store' });
            }
        }
        // If admin, storeId is still required from req.body, and store ownership check is bypassed.
        // The deal's 'user' field will be the admin's ID.

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

const mongoose = require('mongoose'); // For mongoose.Types.ObjectId

// Helper function for distance calculation (Haversine formula)
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// @desc    Get all deals (with optional filtering, including location, using aggregation)
// @route   GET /api/deals
// @access  Public
exports.getDeals = async (req, res) => {
    try {
        const { category, storeId, minPrice, maxPrice, active, latitude, longitude, radius, sortBy } = req.query;

        let userLat, userLon;
        const pipeline = [];
        const matchQuery = {};

        // Default to active deals and quantity available
        matchQuery.isActive = active === 'false' ? false : true;
        matchQuery.quantityAvailable = { $gt: 0 };

        // Location-based filtering (determines which stores to consider)
        if (latitude && longitude) {
            userLat = parseFloat(latitude);
            userLon = parseFloat(longitude);
            const radiusInKm = parseFloat(radius) || 10; // Default radius 10km

            if (isNaN(userLat) || isNaN(userLon)) {
                return res.status(400).json({ success: false, error: 'Invalid latitude or longitude provided.' });
            }

            const radiusInRadians = radiusInKm / 6378.1; // Earth's radius in km

            // Find stores within vicinity - Fetch their locations for later JS calculation if needed
            const storesInVicinity = await Store.find({
                location: {
                    $geoWithin: {
                        $centerSphere: [[userLon, userLat], radiusInRadians]
                    }
                }
            }).select('_id location'); // Select ID and location

            const storeIdsInVicinity = storesInVicinity.map(s => s._id);

            if (storeIdsInVicinity.length === 0) {
                return res.status(200).json({ success: true, count: 0, data: [] });
            }

            if (storeId) { // If specific storeId is also provided
                if (!storeIdsInVicinity.some(id => id.equals(storeId))) {
                    return res.status(200).json({ success: true, count: 0, data: [] });
                }
                matchQuery.store = mongoose.Types.ObjectId(storeId);
            } else {
                matchQuery.store = { $in: storeIdsInVicinity };
            }

        } else if (storeId) {
            matchQuery.store = mongoose.Types.ObjectId(storeId);
        } else if (latitude || longitude) { // Only one of lat/lon provided
            return res.status(400).json({ success: false, error: 'Both latitude and longitude are required for location filtering.' });
        }

        // Add other filters to matchQuery
        if (category) matchQuery.category = category;
        if (minPrice || maxPrice) {
            matchQuery.discountedPrice = {};
            if (minPrice) matchQuery.discountedPrice.$gte = parseFloat(minPrice);
            if (maxPrice) matchQuery.discountedPrice.$lte = parseFloat(maxPrice);
        }

        // Initial $match stage
        pipeline.push({ $match: matchQuery });

        // $lookup for Store
        pipeline.push({
            $lookup: {
                from: 'stores', // The actual collection name for Stores
                localField: 'store',
                foreignField: '_id',
                as: 'storeInfo'
            }
        });
        pipeline.push({ $unwind: '$storeInfo' }); // Each deal has one store

        // $lookup for User (creator of the deal)
        pipeline.push({
            $lookup: {
                from: 'users', // The actual collection name for Users
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo'
            }
        });
        pipeline.push({ $unwind: '$userInfo' }); // Each deal has one user

        // $addFields for discountPercentage
        pipeline.push({
            $addFields: {
                discountPercentage: {
                    $cond: {
                        if: { $gt: ['$originalPrice', 0] },
                        then: {
                            $multiply: [
                                { $divide: [{ $subtract: ['$originalPrice', '$discountedPrice'] }, '$originalPrice'] },
                                100
                            ]
                        },
                        else: 0
                    }
                }
            }
        });

        // Sorting stage (excluding 'distance' for now, handled in JS if specified)
        const sortStage = {};
        if (sortBy && sortBy !== 'distance') {
            if (sortBy === 'newest') sortStage.createdAt = -1;
            else if (sortBy === 'expiry') sortStage.bestBeforeDate = 1;
            else if (sortBy === 'discount') sortStage.discountPercentage = -1;
            else if (sortBy === 'priceAsc') sortStage.discountedPrice = 1;
            else if (sortBy === 'priceDesc') sortStage.discountedPrice = -1;
            else sortStage.createdAt = -1; // Default sort
        } else if (!sortBy) {
            sortStage.createdAt = -1; // Default sort if sortBy is not provided
        }
        if (Object.keys(sortStage).length > 0) {
            pipeline.push({ $sort: sortStage });
        }

        // $project to shape the output
        pipeline.push({
            $project: {
                // Deal fields (include all relevant ones)
                _id: 1,
                itemName: 1,
                description: 1,
                category: 1,
                originalPrice: 1,
                discountedPrice: 1,
                quantityAvailable: 1,
                bestBeforeDate: 1,
                pickupInstructions: 1,
                imageURL: 1,
                isActive: 1,
                createdAt: 1,
                // Calculated field
                discountPercentage: 1,
                // Populated-like fields
                store: { // Renaming storeInfo to store for consistency
                    _id: '$storeInfo._id',
                    storeName: '$storeInfo.storeName',
                    address: '$storeInfo.address',
                    location: '$storeInfo.location', // Crucial for JS distance calculation
                    contactInfo: '$storeInfo.contactInfo',
                    openingHours: '$storeInfo.openingHours',
                    logoURL: '$storeInfo.logoURL'
                },
                user: { // Renaming userInfo to user
                    _id: '$userInfo._id',
                    name: '$userInfo.name'
                    // Add other user fields if needed, e.g., email, but be mindful of privacy
                }
            }
        });

        let deals = await Deal.aggregate(pipeline);

        // Post-aggregation: Calculate distance and sort if sortBy is 'distance'
        if (latitude && longitude && deals.length > 0) {
            deals.forEach(deal => {
                if (deal.store && deal.store.location && deal.store.location.coordinates) {
                    const storeCoords = deal.store.location.coordinates; // [lon, lat]
                    deal.distanceInKm = parseFloat(getDistanceInKm(userLat, userLon, storeCoords[1], storeCoords[0]).toFixed(2));
                } else {
                    deal.distanceInKm = null; // Or some indicator that distance couldn't be calculated
                }
            });

            if (sortBy === 'distance') {
                deals.sort((a, b) => {
                    if (a.distanceInKm === null) return 1; // Push nulls to the end
                    if (b.distanceInKm === null) return -1;
                    return a.distanceInKm - b.distanceInKm;
                });
            }
        }

        res.status(200).json({ success: true, count: deals.length, data: deals });

    } catch (error) {
        console.error('Error in getDeals (aggregation):', error);
        if (error.name === 'CastError') { // e.g. for storeId
            return res.status(400).json({ success: false, error: `Invalid parameter format: ${error.message}` });
        }
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

        // Admin check: Admins can update any deal, others must own the store associated with the deal.
        if (req.user.role !== 'admin') {
            if (!deal.store || deal.store.user.toString() !== req.user.id) {
                return res.status(403).json({ success: false, error: 'User not authorized to update this deal' });
            }
        }
        // If admin, ownership check is bypassed.

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

        // Admin check: Admins can delete any deal, others must own the store associated with the deal.
        if (req.user.role !== 'admin') {
            if (!deal.store || deal.store.user.toString() !== req.user.id) {
                return res.status(403).json({ success: false, error: 'User not authorized to delete this deal' });
            }
        }
        // If admin, ownership check is bypassed.

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
