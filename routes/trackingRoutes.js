const express = require("express");
const router = express.Router();
const { createTracking,getAllTracking } = require("../controller/tracking");

router.post("/", createTracking);
router.get("/", getAllTracking); 


module.exports = router;
