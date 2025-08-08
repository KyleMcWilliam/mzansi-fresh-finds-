const mongoose = require('mongoose');
const config = require('../config/config'); // Adjust path as necessary
const Store = require('../models/Store'); // Adjust path as necessary

async function migrateStoreLocations() {
    let updatedStoresCount = 0;
    let connection;

    try {
        console.log('Connecting to MongoDB...');
        connection = await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex: true, // Not needed for Mongoose 6+
            // useFindAndModify: false // Not needed for Mongoose 6+
        });
        console.log('MongoDB connected successfully.');

        console.log('Finding stores to migrate...');
        // Find stores that have latitude and longitude, but no location.coordinates
        const storesToMigrate = await Store.find({
            latitude: { $exists: true, $ne: null },
            longitude: { $exists: true, $ne: null },
            $or: [
                { location: { $exists: false } },
                { 'location.coordinates': { $exists: false } },
                { 'location.coordinates': { $size: 0 } }
            ]
        });

        if (storesToMigrate.length === 0) {
            console.log('No stores found that require migration.');
            return;
        }

        console.log(`Found ${storesToMigrate.length} stores to migrate.`);

        for (const store of storesToMigrate) {
            try {
                const newLocation = {
                    type: 'Point',
                    coordinates: [store.longitude, store.latitude]
                };

                // Update the store document
                // Using findByIdAndUpdate to ensure we're operating on the correct document
                // and to get the updated document back if needed (though not strictly necessary here)
                const updatedStore = await Store.findByIdAndUpdate(
                    store._id,
                    { $set: { location: newLocation } },
                    { new: true } // Returns the modified document
                );

                if (updatedStore) {
                    console.log(`Updated store: ${store.storeName} (ID: ${store._id}) with location: [${store.longitude}, ${store.latitude}]`);
                    updatedStoresCount++;
                } else {
                    // This case should ideally not happen if the store was found in storesToMigrate
                    console.warn(`Store with ID: ${store._id} was found but could not be updated.`);
                }

            } catch (updateError) {
                console.error(`Error updating store ${store.storeName} (ID: ${store._id}):`, updateError.message);
                // Decide if you want to continue with other stores or stop the script
            }
        }

        console.log(`Migration complete. ${updatedStoresCount} stores updated successfully.`);

    } catch (error) {
        console.error('An error occurred during the migration process:', error.message);
        if (error.reason) { // Mongoose connection error often has a 'reason'
             console.error('MongoDB connection error details:', error.reason);
        }
    } finally {
        if (connection && connection.connection && connection.connection.readyState === 1) { // 1 means connected
            try {
                await mongoose.disconnect();
                console.log('MongoDB disconnected.');
            } catch (disconnectError) {
                console.error('Error disconnecting from MongoDB:', disconnectError.message);
            }
        } else if (connection && connection.connection && connection.connection.readyState !== 1) {
            console.log('MongoDB was not connected, no need to disconnect.');
        } else if (!connection) {
             console.log('No MongoDB connection was established.');
        }
    }
}

// Run the migration script
migrateStoreLocations().then(() => {
    console.log('Migration script finished.');
}).catch(err => {
    console.error('Unhandled error running migration script:', err);
    process.exit(1); // Exit with error code if the script runner itself fails
});
