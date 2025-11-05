// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../controller/payment');

router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;
