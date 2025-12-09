const authController = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mocking mongoose model, jwt and bcrypt
jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should register a new user with default consumer role', async () => {
    // Setup mocks
    User.findOne.mockResolvedValue(null); // No existing user
    User.mockImplementation((userData) => {
        return {
            ...userData,
            id: 'mockUserId',
            save: jest.fn().mockResolvedValue(userData)
        }
    });

    jwt.sign.mockImplementation((payload, secret, options, callback) => {
      callback(null, 'mockToken');
    });

    await authController.registerUser(req, res);

    expect(User).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }));

    // Ensure 'role' is NOT in the object passed to User constructor
    const userConstructorArgs = User.mock.calls[0][0];
    expect(userConstructorArgs).not.toHaveProperty('role');

    // Verify token expiry
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: '7d' },
      expect.anything()
    );

    expect(res.json).toHaveBeenCalledWith({ token: 'mockToken' });
  });

  it('should login a user with correct token expiry', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };

    const mockUser = {
      id: 'mockUserId',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'consumer'
    };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true); // Password matches

    jwt.sign.mockImplementation((payload, secret, options, callback) => {
      callback(null, 'mockToken');
    });

    await authController.loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
            id: 'mockUserId',
            role: 'consumer'
        })
      }),
      expect.anything(),
      { expiresIn: '7d' }, // Verify 7d expiry
      expect.anything()
    );

    expect(res.json).toHaveBeenCalledWith({ token: 'mockToken' });
  });
});
