const express = require('express');
const router = express.Router();
const walletController = require('../controller/wallet');

// Get wallet
router.get('/:userId', walletController.getWallet);

// Add transaction
router.post('/transaction', walletController.addTransaction);

module.exports = router;
