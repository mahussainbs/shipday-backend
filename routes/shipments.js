const express = require('express');
const router = express.Router();
const {
  generateShipments,
  getAllShipments,
  updateOrderStatus,
  getShipmentMetrics,
  getShipmentStatusBreakdown
} = require('../controller/shipment');
const { createShipment, getShipmentById, updateShipment } = require('../controller/admin');

// Shipment routes
router.post('/generate', generateShipments);
router.patch('/orders/status', updateOrderStatus);
router.get('/metrics', getShipmentMetrics);
router.get('/status-breakdown', getShipmentStatusBreakdown);
router.get('/', getAllShipments);
router.post('/', createShipment);
router.get('/:shipmentId', getShipmentById);
router.put('/:shipmentId', updateShipment);

module.exports = router;