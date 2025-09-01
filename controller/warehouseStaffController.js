const WarehouseStaff = require("../models/WarehouseStaff");

// @GET assigned staff for a warehouse
// @GET assigned staff for a warehouse (with attendance from original Staff model)
exports.getWarehouseStaff = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const staff = await WarehouseStaff.find({ warehouseId })
      .populate("staffId", "attendance staffId"); // populate from Staff model

    // Map and combine staff data
    const result = staff.map((assignment) => ({
      _id: assignment._id,
      fullName: assignment.fullName,
      role: assignment.role,
      shift: assignment.shift,
      attendance: assignment.staffId?.attendance || "Present", // pulled from Staff model
      staffCode: assignment.staffId?.staffId || "N/A",
      staffId: assignment.staffId?._id,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};


// @POST assign a staff
exports.assignStaff = async (req, res) => {
  const { staffId, fullName, role, shift, attendance, warehouseId , warehouseName} = req.body;

  try {
    // ✅ Check if staff is already assigned to *any* warehouse
    const exists = await WarehouseStaff.findOne({ staffId });

    if (exists) {
      return res.status(409).json({ message: "Staff is already assigned to another warehouse" });
    }

    const assignment = new WarehouseStaff({
      staffId,
      fullName,
      role,
      shift,
      attendance,
      warehouseId,
      warehouseName,
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    console.error("Error assigning staff:", err);
    res.status(500).json({ error: "Failed to assign staff" });
  }
};


// @PUT update staff assignment
exports.updateAssignment = async (req, res) => {
  try {
    const updated = await WarehouseStaff.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// @DELETE unassign staff
exports.deleteAssignment = async (req, res) => {
  try {
    await WarehouseStaff.findByIdAndDelete(req.params.id);
    res.json({ message: "Unassigned successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
