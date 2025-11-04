const express = require('express');
const router = express.Router();
const {
  getPendingDrivers,
  getAcceptedDrivers,
  getAllDrivers,
  updateDriverStatus,
  createShipment,
  assignShipmentToDriver,
  getAllShipments,
  getShipmentById,
  getDriversByVehicleType,
  updateShipment,
  deleteShipment
} = require('../controller/adminController');

// Driver routes
router.get('/drivers/all', getAllDrivers);
router.get('/drivers/pending', getPendingDrivers);
router.get('/drivers/approved', getAcceptedDrivers);
router.get('/drivers/:vehicleType', getDriversByVehicleType);
router.patch('/drivers/status', updateDriverStatus);

// Shipment routes
router.get('/shipments', getAllShipments);
router.get('/shipments/:shipmentId', getShipmentById);
router.post('/shipments', createShipment);
router.patch('/shipments/:shipmentId', updateShipment);
router.delete('/shipments/:shipmentId', deleteShipment);
router.post('/shipments/assign', assignShipmentToDriver);

module.exports = router;