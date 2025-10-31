const express = require('express');
const router = express.Router();
const {
  requestDriverVerificationCode,
  registerDriver,
  loginDriver,
  getDriverNotifications,
  getDriverShipments,
  updateShipmentStatus,
} = require('../controller/driverController');
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

module.exports = router;