const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  capacity: { type: String, required: true },
  spaceUsed: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  status: {
    type: String,
    enum: ['Active', 'Full Capacity', 'Under Maintenance'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
