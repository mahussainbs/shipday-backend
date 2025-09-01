const express = require("express");
const router = express.Router();
const { createVehicle, getAllVehicles, getVehicleById } = require("../controller/fleetController");

router.post("/add", createVehicle);
router.get("/all", getAllVehicles);
router.get("/:id", getVehicleById); 


module.exports = router;
