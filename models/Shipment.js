const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  routeId: { type: String, required: true },
  trackingNumber: { type: String, required: true },
  start: String,
  end: String,
  status: { type: String, default: 'Delivered' },
  eta: Number ,// or Date depending on how you store it
  driverName: { type: String, default: "Unassigned" },


},
{
  timestamps: true  // ✅ Enables createdAt and updatedAt automatically
});

module.exports = mongoose.model('Shipment', shipmentSchema);
