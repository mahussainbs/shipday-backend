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
  saveUserLocation,
  getUserByEmail,
  getAllCustomers,
  getCustomerById, 
  googleLogin, 
  createNotification, // ✅ Added createNotification
} = require('../controller/authcontroller');

const authMiddleware = require('../middleware/authMiddleware'); // ✅ Consistent naming

router.post('/request-code', requestVerificationCode);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/reset-password', resetPassword);
router.post('/verify-code', verifyCode);
router.post('/profile/save', updateUserProfile);
router.post('/profile/location', saveUserLocation);
router.get('/user', authMiddleware, getUserByEmail); // ✅ Now correct
router.post('/api/profile/save', updateUserProfile);
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/google-login', googleLogin);
router.post('/notification', createNotification); // ✅ Added route for creating notifications



router.get('/dashboard', authMiddleware, (req, res) => {
  res.status(200).json({ message: "This is a protected route", user: req.user });
});

module.exports = router;
