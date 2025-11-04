const express = require("express");
const router = express.Router();

// Import routes
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const shipmentsRoutes = require('./shipments');
const verificationRoutes = require('./verification');
const paymentRoutes = require('./paymentRoutes');
const staffRoutes = require("./staff");
const warehouseRoutes = require('./warehouse');
const warehouseStaffRoutes = require('./warehouseStaffRoutes');
const transactionRoutes = require("./transaction");
const orderRoutes = require('./orderRoutes');
const fleetRoutes = require('./fleet');
const trackingRoutes = require("./trackingRoutes");
const deliveryRoutes = require("./delivery");
const roleRoutes = require('./roleRoutes');
const companyInfoRoutes = require('./companyInfoRoutes');
const notificationRoutes = require('./notificationRoutes');
const walletRoutes = require('./walletRoutes');
const driverRoutes = require('./driver');

// Use routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/shipments', shipmentsRoutes);
router.use('/verification', verificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/staff', staffRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/warehouse-staff', warehouseStaffRoutes);
router.use('/transactions', transactionRoutes);
router.use('/orders', orderRoutes);
router.use('/fleet', fleetRoutes);
router.use('/tracking', trackingRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/roles', roleRoutes);
router.use('/company-info', companyInfoRoutes);
router.use('/notifications', notificationRoutes);
router.use('/wallets', walletRoutes);
router.use('/drivers', driverRoutes);

module.exports = router;