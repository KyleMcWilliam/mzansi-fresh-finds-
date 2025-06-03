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
