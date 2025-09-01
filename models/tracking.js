const mongoose = require("mongoose");

const trackingSchema = new mongoose.Schema({
  
  routeId: { type: String, unique: true },
  trackingId: { type: String, unique: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  eta: { type: String, required: true },
  distance: { type: String, required: true },
   vehicle: { type: String, required: true },
   latitude: { type: Number },
   longitude: { type: Number },
   startLatitude: { type: Number }, // start warehouse latitude
  startLongitude: { type: Number }, // start warehouse longitude
  

});

module.exports = mongoose.model("Tracking", trackingSchema);
