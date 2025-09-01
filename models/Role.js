const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
