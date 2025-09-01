const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true },
  profilePicture: { type: String },
  fullName: { type: String, required: true },
  contactInfo: { type: String, required: true },
  role: { type: String, required: true },
  shift: String, 
  email: { type: String, required: true },
  baseLocation: { type: String, required: true },
  attendance: {
  type: String,
  enum: ["Present", "Absent"],
  default: "Present"
},

}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);
