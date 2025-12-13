// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPaymentIntent, initiatePayFastPayment } = require('../controller/payment');

router.post('/create-payment-intent', createPaymentIntent);
router.post('/payfast', initiatePayFastPayment);

module.exports = router;
