const express = require("express");
const router = express.Router();
const warehouseController = require("../controller/warehouse");

// POST /api/warehouse/add
router.post("/warehouse/add", warehouseController.addWarehouse);

// GET /api/warehouse/all
router.get("/warehouse/all", warehouseController.getAllWarehouses);
router.delete("/delete/:id", warehouseController.deleteWarehouse);
router.put("/update/:id", warehouseController.updateWarehouse);


module.exports = router;
