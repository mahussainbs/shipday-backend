const express = require('express');
const router = express.Router();
const roleController = require('../controller/roleController');

// POST create role
router.post('/', roleController.createRole);

// GET all roles
router.get('/', roleController.getRoles);
// ✅ PUT update role
router.put('/:id', roleController.updateRole);

// ✅ DELETE role
router.delete('/:id', roleController.deleteRole);


module.exports = router;
