const Vehicle = require("../models/Vehicle");

let vehicleCount = 0;

const generateVehicleId = () => {
  vehicleCount += 1;
  return `V${vehicleCount.toString().padStart(5, "0")}`;
};

exports.createVehicle = async (req, res) => {
  try {
    const vehicleId = generateVehicleId();
    const vehicle = new Vehicle({ vehicleId, ...req.body });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllVehicles = async (req, res) => {
  const vehicles = await Vehicle.find().populate("driverId", "fullName");
  res.json(vehicles);
};
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("driverId", "fullName");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

