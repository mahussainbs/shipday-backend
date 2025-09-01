const mongoose = require("mongoose");

const WarehouseStaffSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
    unique: false,
  },
  fullName: String,
  role: String,
  shift: String,
  attendance: {
    type: String,
    default: "Present",
    enum: ["Present", "Absent"],
  },
  warehouseId: {
    type: String,
    required: true,
  },
  warehouseName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("WarehouseStaff", WarehouseStaffSchema);
