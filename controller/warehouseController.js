const Warehouse = require("../models/Warehouse");
const getCoordinates = require("../utils/getCoordinates"); // Import your utility

// Helper to generate next Warehouse ID like WH-001, WH-002
const generateWarehouseId = async () => {
  const lastWarehouse = await Warehouse.findOne().sort({ createdAt: -1 });

  if (!lastWarehouse || !lastWarehouse.id) return "WH-001";

  const lastId = lastWarehouse.id;
  const number = parseInt(lastId.split("-")[1], 10) + 1;
  return `WH-${number.toString().padStart(3, "0")}`;
};

// ✅ Add new warehouse with lat/lon
exports.addWarehouse = async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Get coordinates for location (not full address)
    const coords = await getCoordinates(location);
    if (!coords) {
      return res.status(400).json({ message: "Unable to fetch coordinates" });
    }

    const newId = await generateWarehouseId();

    const newWarehouse = new Warehouse({
      ...req.body,
      id: newId,
      latitude: coords.lat,
      longitude: coords.lon,
    });

    await newWarehouse.save();
    res.status(201).json({ message: "Warehouse added successfully!", warehouse: newWarehouse });
  } catch (err) {
    console.error("Add warehouse error:", err);
    res.status(500).json({ message: "Failed to add warehouse", error: err.message });
  }
};

// ✅ Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch warehouses" });
  }
};

// ✅ Delete warehouse
exports.deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Warehouse.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.json({ message: "Warehouse deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete warehouse", error: err.message });
  }
};

// ✅ Update warehouse
exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Warehouse.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.json({ message: "Warehouse updated successfully", warehouse: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update warehouse", error: err.message });
  }
};
