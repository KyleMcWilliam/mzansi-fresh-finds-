const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Deal = require('../models/Deal');
const config = require('../config/config'); // For mongoURI
const supertest = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js or server.js

const request = supertest(app);

// Function to connect to the database before tests
const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        // console.log('Test MongoDB Connected...');
    } catch (err) {
        console.error('Test MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Function to disconnect from the database after tests
const disconnectDB = async () => {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        // console.log('Test MongoDB Disconnected and Dropped.');
    } catch (err) {
        console.error('Test MongoDB disconnection error:', err.message);
        // process.exit(1); // Don't exit process during teardown, allow Jest to finish
    }
};

// Function to clear all collections in the test database
const clearDB = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};

// Function to create a user with a specific role
const createUser = async (userData) => {
    const user = new User({
        name: userData.name || 'Test User',
        email: userData.email,
        password: userData.password || 'password123', // Password will be hashed by pre-save hook
        role: userData.role || 'consumer', // Default to 'consumer' if not specified
    });
    await user.save();
    return user;
};

// Function to log in a user and get an auth token
const loginUser = async (email, password) => {
    const response = await request
        .post('/api/auth/login')
        .send({ email, password });

    if (response.body.token) {
        return response.body.token;
    }
    // console.error('Login failed in test helper:', response.body);
    return null; // Or throw an error
};

// Helper to create a store
const createStore = async (userId, storeData) => {
    const store = new Store({
        user: userId,
        storeName: storeData.storeName || 'Test Store',
        address: storeData.address || '123 Test St',
        latitude: storeData.latitude || 0,
        longitude: storeData.longitude || 0,
    });
    await store.save();
    return store;
};

// Helper to create a deal
const createDeal = async (userId, storeId, dealData) => {
    const deal = new Deal({
        user: userId,
        store: storeId,
        itemName: dealData.itemName || 'Test Item',
        originalPrice: dealData.originalPrice || 100,
        discountedPrice: dealData.discountedPrice || 50,
    });
    await deal.save();
    return deal;
};


module.exports = {
    connectDB,
    disconnectDB,
    clearDB,
    createUser,
    loginUser,
    createStore,
    createDeal,
    request, // Export supertest instance for direct use in tests
};
