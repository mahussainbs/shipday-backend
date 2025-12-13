const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },

  // Sender Details
  senderDetails: {
    fullName: { type: String },
    company: String,
    email: { type: String },
    mobile: { type: String },
    telephone: String,
    address: {
      street: { type: String },
      suburb: { type: String },
      city: { type: String },
      complex: String,
      province: { type: String },
      postalCode: { type: String }
    }
  },

  // Collection Details
  collectionDetails: {
    dispatcherName: { type: String },
    company: String,
    mobile: { type: String },
    office: String,
    email: { type: String },
    address: {
      street: { type: String },
      suburb: { type: String },
      city: { type: String },
      complex: String,
      province: { type: String },
      postalCode: { type: String },
      latitude: Number,
      longitude: Number
    },
    numberOfItems: { type: Number, default: 1 }
  },

  // Delivery Details
  deliveryDetails: {
    receiverName: { type: String },
    company: String,
    mobile: { type: String },
    office: String,
    email: { type: String },
    address: {
      street: { type: String },
      suburb: { type: String },
      city: { type: String },
      complex: String,
      province: { type: String },
      postalCode: { type: String },
      latitude: Number,
      longitude: Number
    }
  },

  // Parcel Details
  parcelDetails: {
    serviceType: { type: String, enum: ['economy', 'express'] },
    parcelType: { type: String },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: { type: Number }
    },
    specialInstructions: String
  },

  // Payment Details
  payment: {
    method: { type: String, enum: ['ewallet', 'gateway', 'cod', 'payfast'], default: 'gateway' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    amount: { type: Number },
    transactionId: String
  },

  // Legacy/Compatibility fields (populated from above by controller)
  // These are NOT required because controller auto-populates them
  // Added defaults to prevent validation errors
  senderName: { type: String, default: 'N/A' },
  senderPhone: { type: String, default: '0000000000' },
  receiverName: { type: String, default: 'N/A' },
  receiverPhone: { type: String, default: '0000000000' },
  start: { type: String, default: 'Unknown' },
  end: { type: String, default: 'Unknown' },
  parcelWeight: { type: Number, default: 1 },
  packageType: { type: String, default: 'parcel' },
  cost: { type: Number, default: 0 },
  eta: { type: Date, default: Date.now },
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
    timestamps: true  //  Enables createdAt and updatedAt automatically
  });

module.exports = mongoose.model('Shipment', shipmentSchema);
