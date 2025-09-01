const express = require("express");
const router = express.Router();
const controller = require("../controller/warehouseStaffController");

router.get("/:warehouseId", controller.getWarehouseStaff);
router.post("/assign", controller.assignStaff);
router.put("/update/:id", controller.updateAssignment);
router.delete("/delete/:id", controller.deleteAssignment);

module.exports = router;
