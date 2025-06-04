const mongoose = require('mongoose');
const {
  connectDB,
  disconnectDB,
  clearDB,
  createUser,
  loginUser,
  createStore: createStoreHelper, // Renamed to avoid conflict
  request,
} = require('./test-helpers');

describe('Store Controller Integration Tests (Admin Privileges)', () => {
  let adminUser, storeOwnerUser;
  let adminToken, storeOwnerToken;
  let testStoreByStoreOwner;

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

    // Log in users
    adminToken = await loginUser(adminUser.email, 'password123');
    storeOwnerToken = await loginUser(storeOwnerUser.email, 'password123');

    // Create a store by storeOwnerUser
    testStoreByStoreOwner = await createStoreHelper(storeOwnerUser._id, {
      storeName: "Owner's Original Store",
      address: '123 Owner St',
    });
  });

  describe('Admin Creating Stores (/api/stores)', () => {
    test('Admin should be able to create a new store', async () => {
      const newStoreData = {
        storeName: 'Admin Created Store',
        address: '456 Admin Ave',
        latitude: 10.0,
        longitude: 20.0,
        contactInfo: 'admin@store.com',
        openingHours: '9-5 Mon-Fri',
      };

      const res = await request
        .post('/api/stores')
        .set('x-auth-token', adminToken)
        .send(newStoreData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storeName).toBe(newStoreData.storeName);
      expect(res.body.data.user.toString()).toBe(adminUser._id.toString()); // Store owned by admin
    });
  });

  describe('Admin Updating Stores (/api/stores/:storeId)', () => {
    test('Admin should update another user\'s store', async () => {
      const updatedData = {
        storeName: 'Updated Store Name by Admin',
        contactInfo: 'admin_updated@store.com',
      };

      const res = await request
        .put(`/api/stores/${testStoreByStoreOwner._id.toString()}`)
        .set('x-auth-token', adminToken)
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storeName).toBe(updatedData.storeName);
      expect(res.body.data.contactInfo).toBe(updatedData.contactInfo);
      // Ensure the store's original owner remains the same
      const storeInDb = await mongoose.model('Store').findById(testStoreByStoreOwner._id);
      expect(storeInDb.user.toString()).toBe(storeOwnerUser._id.toString());
    });
  });

  describe('Admin Deleting Stores (/api/stores/:storeId)', () => {
    test('Admin should delete another user\'s store', async () => {
      const res = await request
        .delete(`/api/stores/${testStoreByStoreOwner._id.toString()}`)
        .set('x-auth-token', adminToken);

      expect(res.statusCode).toBe(200); // Or 204
      expect(res.body.success).toBe(true); // Assuming { success: true, data: {} }

      // Verify the store is actually deleted
      const storeInDb = await mongoose.model('Store').findById(testStoreByStoreOwner._id);
      expect(storeInDb).toBeNull();
    });
  });

  // TODO: Add sanity checks for non-admin users (store owners)
  // e.g., store owner failing to update/delete stores they don't own.
  // e.g., store owner successfully managing their own store.
});
