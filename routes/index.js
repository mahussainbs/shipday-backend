const express = require("express");
const router = express.Router();

// Import all routes
const authRoutes = require('./auth');
const verificationRoutes = require('./verification');
const paymentRoutes = require('./paymentRoutes');
const staffRoutes = require("./staff");
const warehouseRoutes = require('./warehouse');
const warehouseStaffRoutes = require('./warehouseStaffRoutes');
const transactionRoutes = require("./transaction");
const orderRoutes = require('./orderRoutes');
const fleetRoutes = require('./fleet');
const trackingRoutes = require("./trackingRoutes");
const shipmentRoutes = require('./shipmentRoutes'); 
const deliveryRoutes = require("./delivery");
const scheduleJobs = require("../cron/scheduler");
const roleRoutes = require('./roleRoutes');
const companyInfoRoutes = require('./companyInfoRoutes');
const notificationRoutes = require('./notificationRoutes');
const walletRoutes = require('./walletRoutes');


router.use( authRoutes);
router.use( verificationRoutes);
router.use("/staff", staffRoutes);
router.use('/payment', paymentRoutes);
router.use( warehouseRoutes);
router.use("/warehouse-staff", warehouseStaffRoutes);
router.use("/transactions", transactionRoutes);
router.use( orderRoutes);
router.use("/fleet", fleetRoutes);
router.use("/trackings", trackingRoutes);
router.use('/shipment', shipmentRoutes);
router.use("/deliveries", deliveryRoutes);
router.use('/roles', roleRoutes);
router.use('/company-info', companyInfoRoutes);
router.use('/notifications', notificationRoutes);
router.use('/wallet', walletRoutes);

module.exports = router;
