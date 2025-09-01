const express = require("express");
const router = express.Router();
const deliveryController = require("../controller/deliveryController");

router.post("/", deliveryController.createDelivery);
router.get("/", deliveryController.getAllDeliveries);
router.get("/driver", deliveryController.getDriverByShipment);
router.get("/stats", deliveryController.getPendingDeliveryStats);
router.get("/delivered-stats", deliveryController.getDeliveredStats);
router.get("/chart-stats", deliveryController.getChartStats); // ✅ Add this line
router.post("/auto-create", deliveryController.triggerAutoCreateDeliveries);


module.exports = router;
