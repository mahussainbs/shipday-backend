const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  vehicleType: { 
    type: String, 
    required: true,
    enum: ['bike', 'car', 'van', 'truck']
  },
  eta: { type: Date, required: true },
  notes: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'Shipping', 'Delivered'], 
    default: 'Pending' 
  },
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver',
    default: null
  },
  dateShipped: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  routeId: { type: String },
  trackingNumber: { type: String },
  driverName: { type: String, default: "Unassigned" }
},
{
  timestamps: true  // ✅ Enables createdAt and updatedAt automatically
});

module.exports = mongoose.model('Shipment', shipmentSchema);
