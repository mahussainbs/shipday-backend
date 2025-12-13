const express = require('express');
const router = express.Router();
const { getPricingConfig, updatePricingConfig } = require('../controller/pricing');

router.get('/', getPricingConfig);
router.put('/', updatePricingConfig);

module.exports = router;
