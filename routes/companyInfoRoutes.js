const express = require('express');
const router = express.Router();
const { getCompanyInfo, saveCompanyInfo } = require('../controller/companyInfo');

router.get('/', getCompanyInfo);
router.post('/', saveCompanyInfo);

module.exports = router;
