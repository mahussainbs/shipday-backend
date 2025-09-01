const express = require("express");
const router = express.Router();

const {
  addNewStaff,
  getAllStaff,
  assignTaskToStaff,
  getAssignedTasks,
  updateRoute,
  updateStaff,
  deleteRoute,
  deleteStaff,
  getRoutesGroupedByStaff,
  getDriverByRoute,
   getDriverByName,
   
} = require("../controller/staffController");


router.post("/add", addNewStaff);
router.get("/all", getAllStaff);
router.post("/assign-task/:staffId", assignTaskToStaff);
router.get("/:id/tasks", getAssignedTasks);
router.put("/:staffId/update-task/:routeId", updateRoute);
router.put("/update/:id", updateStaff); // ✅ FIXED
router.delete("/delete/:id", deleteStaff); // ✅ FIXED

router.delete("/:staffId/remove-task/:routeId", deleteRoute);


router.get("/grouped-routes", getRoutesGroupedByStaff); // ✅ NEW ENDPOINT
router.get("/driver-by-route", getDriverByRoute);
router.get("/driver-by-name", getDriverByName); // ✅ NEW ENDPOINT





module.exports = router;
