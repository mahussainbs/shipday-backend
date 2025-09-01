const Delivery = require("../models/Delivery");
const generateDeliveryId = require("../utils/generateDeliveryId");
const Shipment = require("../models/Shipment");
const Route = require("../models/Route");
const Staff = require("../models/Staff");

// Create a new delivery
exports.createDelivery = async (req, res) => {
  try {
    const { shipmentId } = req.body;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // Avoid duplicate delivery
    const exists = await Delivery.findOne({ shipmentId });
    if (exists) return res.status(400).json({ message: "Delivery already exists for this shipment" });

    // Get driver from route
    const route = await Route.findOne({
      origin: shipment.start,
      destination: shipment.end,
    }).populate("staffId", "fullName");

    const driverName = route?.staffId?.fullName || "Unassigned";

    const newDelivery = new Delivery({
      deliveryId: await generateDeliveryId(),
      shipmentId: shipment.shipmentId,
      driverName,
      vehicleType: shipment.vehicleType,
      dateShipped: shipment.dateShipped,
      estimatedDelivery: shipment.eta,
      status: shipment.status,
      origin: shipment.start,
      destination: shipment.end,
      routeId: shipment.routeId,
      orders: shipment.orders,
    });

    await newDelivery.save();
    res.status(201).json(newDelivery);
  } catch (err) {
    res.status(500).json({ message: "Error creating delivery", error: err.message });
  }
};

// Get all deliveries with accurate driver name
exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });

    const enrichedDeliveries = await Promise.all(
      deliveries.map(async (delivery) => {
        const shipment = await Shipment.findOne({ shipmentId: delivery.shipmentId }).populate("orders");

        if (shipment) {
          // Update delivery.orders with real order data
          if (shipment.orders && shipment.orders.length) {
            delivery.orders = shipment.orders;

            const allDelivered = shipment.orders.every(order => order.status === "Delivered");
            const newStatus = allDelivered ? "Delivered" : "Onboarding";

            if (delivery.status !== newStatus) {
              delivery.status = newStatus;
            }

            await delivery.save(); // Save updated delivery
          }
        }

        const route = await Route.findOne({
          origin: delivery.origin,
          destination: delivery.destination,
        }).populate("staffId", "fullName");

        return {
          ...delivery.toObject(),
          driverName: route?.staffId?.fullName || "Unassigned",
        };
      })
    );

    res.json(enrichedDeliveries);
  } catch (err) {
    console.error("Failed to get deliveries", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Get driver details by shipmentId
exports.getDriverByShipment = async (req, res) => {
  const { shipmentId } = req.query;

  try {
    if (!shipmentId) return res.status(400).json({ message: "shipmentId is required" });

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const { start, end } = shipment;

    const route = await Route.findOne({ origin: start, destination: end }).populate({
      path: "staffId",
      select: "fullName email contactInfo role",
    });

    if (!route || !route.staffId) {
      return res.status(404).json({ message: "Route or driver not found" });
    }

    const staff = route.staffId;

    if (staff.role !== "Driver") {
      return res.status(404).json({ message: "Assigned staff is not a driver" });
    }

    return res.json({
      driverName: staff.fullName,
      email: staff.email,
      contact: staff.contactInfo,
    });

  } catch (err) {
    console.error("Error fetching driver by shipment:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.autoCreateDeliveries = async () => {
  try {
    const shipments = await Shipment.find();

    for (const shipment of shipments) {
      const exists = await Delivery.findOne({ shipmentId: shipment.shipmentId });
      if (exists) continue; // Already has a delivery

      const route = await Route.findOne({
        origin: shipment.start,
        destination: shipment.end,
      }).populate("staffId", "fullName");

      const driverName = route?.staffId?.fullName || "Unassigned";

      const newDelivery = new Delivery({
        deliveryId: await generateDeliveryId(),
        shipmentId: shipment.shipmentId,
        driverName,
        vehicleType: shipment.vehicleType,
        dateShipped: shipment.dateShipped,
        estimatedDelivery: shipment.eta,
        status: shipment.status,
        origin: shipment.start,
        destination: shipment.end,
        routeId: shipment.routeId,
        orders: shipment.orders,
      });

      await newDelivery.save();
      console.log(`✔️ Created delivery for shipment ${shipment.shipmentId}`);
    }

    console.log("✅ Auto delivery creation complete.");
  } catch (err) {
    console.error("❌ Error in autoCreateDeliveries:", err.message);
  }
};
exports.getPendingDeliveryStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfThisMonth - 1);

    const currentCount = await Delivery.countDocuments({
      status: { $in: ["Pending", "Onboarding"] },
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthCount = await Delivery.countDocuments({
      status: { $in: ["Pending", "Onboarding"] },
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const growth =
      lastMonthCount === 0
        ? currentCount === 0
          ? 0
          : 100
        : ((currentCount - lastMonthCount) / lastMonthCount) * 100;

    res.json({
      totalPendingDeliveries: currentCount,
      growth: Number(growth.toFixed(2)),
    });
  } catch (err) {
    console.error("Failed to get delivery stats:", err);
    res.status(500).json({ message: "Error fetching delivery stats" });
  }
};
exports.getDeliveredStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfThisMonth - 1);

    const currentCount = await Delivery.countDocuments({
      status: "Delivered",
      createdAt: { $gte: startOfThisMonth },
    });

    const lastMonthCount = await Delivery.countDocuments({
      status: "Delivered",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const growth =
      lastMonthCount === 0
        ? currentCount === 0
          ? 0
          : 100
        : ((currentCount - lastMonthCount) / lastMonthCount) * 100;

    res.json({
      totalDelivered: currentCount,
      growth: Number(growth.toFixed(2)),
    });
  } catch (err) {
    console.error("Failed to get delivered stats:", err);
    res.status(500).json({ message: "Error fetching delivered stats" });
  }
};
exports.getChartStats = async (req, res) => {
  const { range = "yearly" } = req.query;

  try {
    let labels = [];
    let deliveryCounts = [];
    let pendingCounts = [];

    const now = new Date();

    if (range === "yearly") {
      // Past 7 months
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const delivered = await Delivery.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: "Delivered",
        });

        const pending = await Delivery.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["Pending", "Onboarding"] },
        });

        labels.push(start.toLocaleString("default", { month: "short" }));
        deliveryCounts.push(delivered);
        pendingCounts.push(pending);
      }
    } else if (range === "monthly") {
      // Current month weeks
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let week = 0; week < 4; week++) {
        const start = new Date(startOfMonth);
        start.setDate(week * 7 + 1);
        const end = new Date(startOfMonth);
        end.setDate((week + 1) * 7);

        const delivered = await Delivery.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: "Delivered",
        });

        const pending = await Delivery.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["Pending", "Onboarding"] },
        });

        labels.push(`Week ${week + 1}`);
        deliveryCounts.push(delivered);
        pendingCounts.push(pending);
      }
    } else if (range === "weekly") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);

        const start = new Date(day.setHours(0, 0, 0, 0));
        const end = new Date(day.setHours(23, 59, 59, 999));

        const delivered = await Delivery.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: "Delivered",
        });

        const pending = await Delivery.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["Pending", "Onboarding"] },
        });

        labels.push(start.toLocaleDateString("en-IN", { weekday: "short" }));
        deliveryCounts.push(delivered);
        pendingCounts.push(pending);
      }
    }

    res.json({ labels, deliveryCounts, pendingCounts });
  } catch (err) {
    console.error("Error generating chart stats:", err);
    res.status(500).json({ message: "Failed to generate chart data" });
  }
};
exports.triggerAutoCreateDeliveries = async (req, res) => {
  try {
    await exports.autoCreateDeliveries(); // call the internal function
    res.status(200).json({ message: "Auto delivery creation triggered." });
  } catch (err) {
    console.error("Failed to auto-create deliveries:", err);
    res.status(500).json({ message: "Error creating deliveries." });
  }
};
