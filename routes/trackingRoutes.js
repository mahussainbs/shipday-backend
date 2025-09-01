const express = require("express");
const router = express.Router();
const { createTracking,getAllTracking } = require("../controller/trackingController");

router.post("/", createTracking);
router.get("/", getAllTracking); 


module.exports = router;
