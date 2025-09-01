const express = require('express');
const router = express.Router();
const { generateShipments,getAllShipments,updateOrderStatus,syncShipmentStatuses,getShipmentCount,getShipmentMetrics,getShipmentStatusBreakdown } = require('../controller/shipmentController');

router.post('/generate', generateShipments);
router.get('/', getAllShipments); 
router.post("/update-order-status",updateOrderStatus);
router.put("/sync-statuses", syncShipmentStatuses);
router.get("/count", getShipmentCount);
router.get('/metrics', getShipmentMetrics); // ✅ new route
router.get("/status-breakdown", getShipmentStatusBreakdown);


module.exports = router;
