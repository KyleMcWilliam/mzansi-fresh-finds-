const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST api/auth/login
// @desc    Login user / Return JWT Token
// @access  Public
router.post('/login', authController.loginUser);

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', authMiddleware, authController.getUser);

module.exports = router;
