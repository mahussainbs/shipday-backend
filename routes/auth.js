const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  requestVerificationCode,
  logoutUser,
  resetPassword,
  verifyCode,
  updateUserProfile,
  getUserByEmail,
  getAllCustomers
} = require('../controller/auth');

const authMiddleware = require('../middleware/authMiddleware');

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/reset-password', resetPassword);

// Verification routes
router.post('/verification/request', requestVerificationCode);
router.post('/verification/verify', verifyCode);

// User profile routes
router.get('/profile', authMiddleware, getUserByEmail);
router.patch('/profile', updateUserProfile);

// Customer routes
router.get('/customers', getAllCustomers);

module.exports = router;