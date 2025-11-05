const express = require('express');
const router = express.Router();
const { generateShipments,getAllShipments,updateOrderStatus,syncShipmentStatuses,getShipmentCount,getShipmentMetrics,getShipmentStatusBreakdown } = require('../controller/shipment');
const { createShipment, getShipmentById, updateShipment } = require('../controller/admin');

router.post('/', createShipment); //  Main POST route for creating individual shipments
router.get('/:shipmentId', getShipmentById); //  Get shipment by ID
router.put('/:shipmentId', updateShipment); //  Update shipment by ID
router.post('/generate', generateShipments);
router.get('/', getAllShipments); 
router.post("/update-order-status",updateOrderStatus);
router.put("/sync-statuses", syncShipmentStatuses);
router.get("/count", getShipmentCount);
router.get('/metrics', getShipmentMetrics); //  new route
router.get("/status-breakdown", getShipmentStatusBreakdown);


module.exports = router;
