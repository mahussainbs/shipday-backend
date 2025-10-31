const express = require('express');
const router = express.Router();
const {
  getPendingDrivers,
  getAcceptedDrivers,
  updateDriverStatus,
  createShipment,
  assignShipmentToDriver,
  getAssignedShipments,
  getAllShipments,
  getDriversByVehicleType,
  updateShipment
} = require('../controller/adminController');

// Get pending drivers
router.get('/drivers/pending', getPendingDrivers);

// Get accepted drivers
router.get('/drivers/accepted', getAcceptedDrivers);

// Approve/Reject driver
router.put('/drivers/status', updateDriverStatus);

// Create shipment
router.post('/create-shipment', createShipment);

// Assign shipment to driver
router.post('/assign-shipment', assignShipmentToDriver);

// Get all assigned shipments
router.get('/assigned-shipments', getAssignedShipments);

// Get all shipments
router.get('/shipments', getAllShipments);

// Get drivers by vehicle type (put this after other specific routes)
router.get('/drivers/:vehicleType', getDriversByVehicleType);

// Update shipment details
router.put('/update-shipment', updateShipment);

module.exports = router;