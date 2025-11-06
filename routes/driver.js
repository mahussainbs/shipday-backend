const express = require('express');
const router = express.Router();
const {
  requestDriverVerificationCode,
  registerDriver,
  loginDriver,
  getDriverNotifications,
  getDriverShipments,
  updateShipmentStatus,
  updateDriverFCMToken,
  testPushNotification,
  checkDriver,
  forgotPassword,
  resetPassword,
  createTestNotification,
} = require('../controller/driver');
const upload = require('../middleware/upload');

// Driver registration (collect details and send OTP)
router.post('/register', upload.single('idProof'), registerDriver);

// Driver verification (confirm OTP and create account)
router.post('/request-verification', requestDriverVerificationCode);

// Driver login
router.post('/login', loginDriver);

// Get driver notifications
router.get('/notifications/:driverId', getDriverNotifications);

// Get driver's assigned shipments
router.get('/shipments/:driverId', getDriverShipments);

// Update shipment status
router.put('/update-shipment-status', updateShipmentStatus);

// Update driver FCM token
router.put('/fcm-token/:driverId', updateDriverFCMToken);

// Test push notification
router.post('/test-notification/:driverId', testPushNotification);

// Check if driver exists
router.get('/check/:driverId', checkDriver);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Create test notification
router.post('/create-test-notification/:driverId', createTestNotification);

module.exports = router;