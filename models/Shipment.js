const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  senderName: { type: String, required: true },
  senderPhone: { type: String, required: true },
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  parcelWeight: { type: Number, required: true },
  packageType: {
    type: String,
    enum: ['document', 'parcel', 'envelope','fragile', 'electronics', 'clothing', 'food','other'],
    required: true
  },
  cost: { type: Number, required: true },
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
