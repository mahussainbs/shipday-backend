const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, unique: true },
  shipmentId: { type: String, required: true },
  driverName: String,
  vehicleType: String,
  dateShipped: String,
  estimatedDelivery: String,
  status: String,
  origin: String,
  destination: String,
  routeId: String,
  orders: [Object],
}, { timestamps: true });

module.exports = mongoose.model("Delivery", deliverySchema);
