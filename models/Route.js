const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  routeId: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  vehicle: { type: String },
  date: { type: String, required: true },
  packageDetails: { type: String },
  instructions: { type: String },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" }, // NEW
  status: { type: String, default: "Assigned" },
});

module.exports = mongoose.model("Route", routeSchema);
