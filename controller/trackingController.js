const Tracking = require("../models/tracking");
const Warehouse = require("../models/Warehouse"); // Import warehouse model
const getCoordinates = require("../utils/getCoordinates"); // LocationIQ utility

// Helper to pad numbers with zeros
const padNumber = (num, size) => {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
};

exports.createTracking = async (req, res) => {
  try {
    // Get the last entry to generate next route/tracking ID
    const lastEntry = await Tracking.findOne().sort({ routeId: -1 });

    let nextNumber = 1;
    if (lastEntry && lastEntry.routeId) {
      const lastNum = parseInt(lastEntry.routeId.replace("RET", ""));
      nextNumber = lastNum + 1;
    }

    const routeId = `RET${padNumber(nextNumber, 3)}`;
    const trackingId = `TRK${padNumber(nextNumber, 4)}`;

    // 🌍 Get coordinates for end address using LocationIQ
    const receiverAddress = req.body.end;
    console.log("Received address (end):", receiverAddress);

    let destinationCoordinates = { lat: null, lon: null };
    if (receiverAddress) {
      const result = await getCoordinates(receiverAddress);
      if (result) {
        destinationCoordinates = result;
      }
    }

    // 🏭 Get coordinates for start warehouse from DB
    const startWarehouse = await Warehouse.findOne({ name: req.body.start });
    let startLatitude = null;
    let startLongitude = null;

    if (startWarehouse) {
      startLatitude = startWarehouse.latitude || null;
      startLongitude = startWarehouse.longitude || null;
    } else {
      console.warn("Start warehouse not found:", req.body.start);
    }

    // ✅ Create and save new tracking
    const newTracking = new Tracking({
      ...req.body,
      routeId,
      trackingId,
      latitude: destinationCoordinates.lat,     // End point latitude
      longitude: destinationCoordinates.lon,    // End point longitude
      startLatitude,                            // Start warehouse latitude
      startLongitude,                           // Start warehouse longitude
    });

    const savedTracking = await newTracking.save();
    res.status(201).json({ tracking: savedTracking });
  } catch (error) {
    console.error("Error creating tracking:", error);
    res.status(500).json({ message: "Error creating tracking", error: error.message });
  }
};

exports.getAllTracking = async (req, res) => {
  try {
    const trackings = await Tracking.find().sort({ createdAt: -1 });
    res.status(200).json(trackings);
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    res.status(500).json({ message: "Error fetching tracking data", error: error.message });
  }
};
