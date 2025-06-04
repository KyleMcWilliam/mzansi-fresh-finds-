// tests/dealController.test.js
const { getDeals } = require('../controllers/dealController');
const Deal = require('../models/Deal');
const Store = require('../models/Store');
const mongoose = require('mongoose'); // Required for mongoose.Types.ObjectId

// Mock Mongoose models
jest.mock('../models/Deal');
jest.mock('../models/Store');

// Mock console.error to avoid polluting test output for expected errors
let consoleErrorMock;
beforeAll(() => { // Changed to beforeAll as it's a global mock
  consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => { // Changed to afterAll
  consoleErrorMock.mockRestore();
});

describe('getDeals Controller', () => {
  let mockReq;
  let mockRes;
  const mockDealsArray = [
    { _id: 'deal1', itemName: 'Deal 1', store: { _id: 'store1', storeName: 'Store A', location: { type: 'Point', coordinates: [28.0, -26.0] } } },
    { _id: 'deal2', itemName: 'Deal 2', store: { _id: 'store2', storeName: 'Store B', location: { type: 'Point', coordinates: [28.1, -26.1] } } }
  ];
  const mockStoresArray = [
    { _id: 'store1', name: 'Store A', location: { type: 'Point', coordinates: [28.0, -26.0] } },
    { _id: 'store2', name: 'Store B', location: { type: 'Point', coordinates: [28.1, -26.1] } }
  ];


  beforeEach(() => {
    mockReq = {
      query: {} // Default empty query
    };
    mockRes = {
      status: jest.fn().mockReturnThis(), // Allows chaining .json()
      json: jest.fn()
    };
    // Reset mocks for Deal.aggregate and Store.find before each test
    // Deal.aggregate is a function that returns an object with an exec method
    Deal.aggregate.mockReturnValue({
        // exec: jest.fn().mockResolvedValue(mockDealsArray) // Default mock, can be overridden
        // exec is not directly on aggregate, it's on the result of pipeline stages.
        // The controller code is `await Deal.aggregate(pipeline);`
        // So, Deal.aggregate itself should be a jest.fn() that returns a promise
        // or if it's chainable for more pipeline stages (which it is, but not used like that in controller)
        // For simplicity, if Deal.aggregate(pipeline) is directly awaited:
        mockResolvedValue: jest.fn().mockResolvedValue(mockDealsArray) // Default mock
    });
    // If Deal.aggregate(pipeline).exec() was used, then:
    // Deal.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockDealsArray) });
    // Let's assume Deal.aggregate(pipeline) itself is what's awaited.
    Deal.aggregate.mockResolvedValue(mockDealsArray);


    Store.find.mockResolvedValue(mockStoresArray); // Default mock for Store.find
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mock usage data after each test
  });

  test('1. Basic Success Case (No Filters)', async () => {
    await getDeals(mockReq, mockRes);

    expect(Deal.aggregate).toHaveBeenCalledTimes(1);
    // Check the initial $match stage for default filters
    const pipeline = Deal.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.isActive).toBe(true);
    expect(pipeline[0].$match.quantityAvailable).toEqual({ $gt: 0 });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      count: mockDealsArray.length,
      data: mockDealsArray
    });
  });

  test('2. Geospatial Filtering (latitude, longitude, radius)', async () => {
    mockReq.query = { latitude: '10.0', longitude: '20.0', radius: '5' };
    const foundStoreIds = mockStoresArray.map(s => s._id); // Simulate Store.find returning these
    Store.find.mockResolvedValue(mockStoresArray); // Stores found by geo query
    Deal.aggregate.mockResolvedValue(mockDealsArray); // Deals found for those stores

    await getDeals(mockReq, mockRes);

    expect(Store.find).toHaveBeenCalledTimes(1);
    const storeQuery = Store.find.mock.calls[0][0];
    expect(storeQuery.location.$geoWithin.$centerSphere[0]).toEqual([20.0, 10.0]); // lon, lat
    expect(storeQuery.location.$geoWithin.$centerSphere[1]).toBeCloseTo(5 / 6378.1); // radius in radians

    expect(Deal.aggregate).toHaveBeenCalledTimes(1);
    const dealPipeline = Deal.aggregate.mock.calls[0][0];
    // Check that the $match stage for deals includes filtering by the store IDs
    const matchStage = dealPipeline.find(stage => stage.$match && stage.$match.store);
    expect(matchStage.$match.store.$in.map(id => id.toString())).toEqual(foundStoreIds.map(id => id.toString()));

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: mockDealsArray.length }));
  });

  test('2.1 Geospatial Filtering - No stores found', async () => {
    mockReq.query = { latitude: '10.0', longitude: '20.0', radius: '1' };
    Store.find.mockResolvedValue([]); // No stores found

    await getDeals(mockReq, mockRes);

    expect(Store.find).toHaveBeenCalledTimes(1);
    expect(Deal.aggregate).not.toHaveBeenCalled(); // Should not query deals if no stores found
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, count: 0, data: [] });
  });


  test('3. Sorting (sortBy=discount)', async () => {
    mockReq.query = { sortBy: 'discount' };
    Deal.aggregate.mockResolvedValue(mockDealsArray);

    await getDeals(mockReq, mockRes);

    expect(Deal.aggregate).toHaveBeenCalledTimes(1);
    const pipeline = Deal.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find(stage => stage.$sort);
    expect(sortStage).toBeDefined();
    expect(sortStage.$sort).toEqual({ discountPercentage: -1 });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('3.1 Sorting (sortBy=newest)', async () => {
    mockReq.query = { sortBy: 'newest' };
    Deal.aggregate.mockResolvedValue(mockDealsArray);
    await getDeals(mockReq, mockRes);
    const pipeline = Deal.aggregate.mock.calls[0][0];
    const sortStage = pipeline.find(stage => stage.$sort);
    expect(sortStage).toBeDefined();
    expect(sortStage.$sort).toEqual({ createdAt: -1 });
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('4. Category Filtering (category=bakery)', async () => {
    mockReq.query = { category: 'bakery' };
    Deal.aggregate.mockResolvedValue(mockDealsArray);

    await getDeals(mockReq, mockRes);

    expect(Deal.aggregate).toHaveBeenCalledTimes(1);
    const pipeline = Deal.aggregate.mock.calls[0][0];
    const matchStage = pipeline.find(stage => stage.$match); // The first stage is $match
    expect(matchStage).toBeDefined();
    expect(matchStage.$match.category).toEqual('bakery');
    // Also check default filters are there
    expect(matchStage.$match.isActive).toBe(true);
    expect(matchStage.$match.quantityAvailable).toEqual({ $gt: 0 });


    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('5. Invalid Location Parameters (latitude only)', async () => {
    mockReq.query = { latitude: 'invalid' }; // Missing longitude
    await getDeals(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Both latitude and longitude are required for location filtering.'
    });
  });

  test('5.1 Invalid Location Parameters (non-numeric latitude)', async () => {
    mockReq.query = { latitude: 'abc', longitude: '20.0' };
    await getDeals(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid latitude or longitude provided.'
    });
  });

  test('6. Database Error (Aggregation Fails)', async () => {
    mockReq.query = {};
    const dbError = new Error('DB Aggregate Error');
    Deal.aggregate.mockRejectedValue(dbError);

    await getDeals(mockReq, mockRes);

    expect(Deal.aggregate).toHaveBeenCalledTimes(1);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error' // The generic error message from controller's catch-all
    });
    expect(consoleErrorMock).toHaveBeenCalledWith('Error in getDeals (aggregation):', dbError);
  });

  test('6.1 Database Error (Store.find Fails)', async () => {
    mockReq.query = { latitude: '10.0', longitude: '20.0' };
    const dbError = new Error('DB Store.find Error');
    Store.find.mockRejectedValue(dbError);

    await getDeals(mockReq, mockRes);

    expect(Store.find).toHaveBeenCalledTimes(1);
    expect(Deal.aggregate).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error'
    });
    expect(consoleErrorMock).toHaveBeenCalledWith('Error in getDeals (aggregation):', dbError);
  });

});

// Integration tests for Deal CRUD operations with Admin privileges
const {
  connectDB,
  disconnectDB,
  clearDB,
  createUser,
  loginUser,
  createStore,
  createDeal: createDealHelper, // Renamed to avoid conflict with controller functions if any were imported directly
  request,
} = require('./test-helpers');

describe('Deal Controller Integration Tests (Admin Privileges)', () => {
  let adminUser, regularUser, storeOwnerUser;
  let adminToken, regularUserToken, storeOwnerToken;
  let testStoreByRegularUser, testStoreByStoreOwner;
  let dealInRegularUserStore;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    // Create users
    adminUser = await createUser({ email: 'admin@example.com', name: 'Admin User', role: 'admin' });
    storeOwnerUser = await createUser({ email: 'owner@example.com', name: 'Store Owner', role: 'store_owner' });
    // regularUser = await createUser({ email: 'consumer@example.com', name: 'Regular Consumer', role: 'consumer' }); // If needed

    // Log in users
    adminToken = await loginUser(adminUser.email, 'password123');
    storeOwnerToken = await loginUser(storeOwnerUser.email, 'password123');
    // regularUserToken = await loginUser(regularUser.email, 'password123');

    // Create stores
    testStoreByStoreOwner = await createStore(storeOwnerUser._id, { storeName: "Owner's Store" });

    // Create a deal by storeOwnerUser in their store
    dealInRegularUserStore = await createDealHelper(storeOwnerUser._id, testStoreByStoreOwner._id, {
      itemName: 'Initial Deal by Owner',
      originalPrice: 100,
      discountedPrice: 80,
    });
  });

  describe('Admin Creating Deals (/api/deals)', () => {
    test('Admin should create a deal for another user\'s store', async () => {
      const dealData = {
        storeId: testStoreByStoreOwner._id.toString(),
        itemName: 'Admin Special Deal',
        description: 'Created by admin for another store',
        category: 'Electronics',
        originalPrice: 200,
        discountedPrice: 150,
        quantityAvailable: 10,
      };

      const res = await request
        .post('/api/deals')
        .set('x-auth-token', adminToken)
        .send(dealData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itemName).toBe(dealData.itemName);
      expect(res.body.data.store.toString()).toBe(testStoreByStoreOwner._id.toString());
      expect(res.body.data.user.toString()).toBe(adminUser._id.toString()); // Deal user should be admin
    });
  });

  describe('Admin Updating Deals (/api/deals/:dealId)', () => {
    test('Admin should update a deal in another user\'s store', async () => {
      const updatedData = {
        itemName: 'Updated Deal Name by Admin',
        discountedPrice: 70,
      };

      const res = await request
        .put(`/api/deals/${dealInRegularUserStore._id.toString()}`)
        .set('x-auth-token', adminToken)
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itemName).toBe(updatedData.itemName);
      expect(res.body.data.discountedPrice).toBe(updatedData.discountedPrice);
      // Ensure the original deal creator (storeOwnerUser) is still the user associated with the deal's store
      // The deal model itself has a 'user' field (creator of the deal) and a 'store' field (which has its own user - the store owner)
      // The deal's user field might change if an admin updates it explicitly, but here we test if admin can update a deal they didn't create.
      // The deal's 'user' field should remain storeOwnerUser._id unless admin explicitly changes it (which is not part of this test)
      // Rereading dealController update, it does not change deal.user
      const dealInDb = await mongoose.model('Deal').findById(dealInRegularUserStore._id);
      expect(dealInDb.user.toString()).toBe(storeOwnerUser._id.toString());
    });
  });

  describe('Admin Deleting Deals (/api/deals/:dealId)', () => {
    test('Admin should delete a deal from another user\'s store', async () => {
      const res = await request
        .delete(`/api/deals/${dealInRegularUserStore._id.toString()}`)
        .set('x-auth-token', adminToken);

      expect(res.statusCode).toBe(200); // Or 204 if no content is returned
      expect(res.body.success).toBe(true); // Assuming delete returns { success: true, data: { message: "Deal removed" } }

      // Verify the deal is actually deleted
      const dealInDb = await mongoose.model('Deal').findById(dealInRegularUserStore._id);
      expect(dealInDb).toBeNull();
    });
  });

  // TODO: Add sanity checks for non-admin users if not already covered by other test files
  // e.g., store owner failing to update/delete deals in a store they don't own.
  // e.g., store owner successfully managing deals in their own store.
});
