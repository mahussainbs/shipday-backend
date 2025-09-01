
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Tracking = require('../models/tracking');
const generateShipmentId = require('../utils/generateShipmentId');
const isWithinRadius = require('../utils/isWithinRadius');


function getRandomStatus() {
  const statuses = ["Delivery", "In Transit", "Pending", "Cancelled"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

exports.generateShipments = async (req, res) => {
  try {
    const orders = await Order.find();
    const routes = await Tracking.find().sort({ createdAt: -1 }); // Sort: most recent first

    console.log(`📦 Total Orders: ${orders.length}`);
    console.log(`🛣️  Total Routes: ${routes.length}`);

    const assignedOrderIds = new Set(); // Track assigned orders
    const shipments = [];

    // ✅ Fetch all existing shipment orders once
    const existingShipmentOrders = new Set(
      (await Shipment.find({}, "orders")).flatMap(s =>
        s.orders.map(id => id.toString())
      )
    );

    for (const route of routes) {
      const {
        startLatitude: startLat,
        startLongitude: startLng,
        latitude: endLat,
        longitude: endLng,
        routeId,
        trackingId,
        start,
        end,
      } = route || {};

      if (
        typeof startLat !== "number" || typeof startLng !== "number" ||
        typeof endLat !== "number" || typeof endLng !== "number" ||
        typeof end !== "string" || end.trim() === ""
      ) {
        console.warn(`⚠️ Skipping route ${routeId || "(unknown)"} due to missing data`);
        continue;
      }

      console.log(`🔍 Processing Route ${routeId} → ${end}`);

      // Filter orders within 50 km of this route's end location
      const matchingOrders = orders.filter(order => {
        if (
          !order.location?.lat ||
          !order.location?.lon ||
          !order.deliveryAddress ||
          assignedOrderIds.has(order._id.toString()) ||          // already in this run
          existingShipmentOrders.has(order._id.toString())       // already in DB
        ) {
          return false;
        }

        const distance = isWithinRadius.getDistanceFromLatLonInKm(
          order.location.lat,
          order.location.lon,
          endLat,
          endLng
        );

        return distance <= 50;
      });

      console.log(`✅ Route ${routeId} matched ${matchingOrders.length} unassigned orders.`);

      if (matchingOrders.length === 0) continue;

      // Update assigned set
      matchingOrders.forEach(o => assignedOrderIds.add(o._id.toString()));

      // Check if shipment already exists
      let shipment = await Shipment.findOne({ routeId, end });

      if (shipment) {
        const existingOrderIds = shipment.orders.map(id => id.toString());
        const newOrderIds = matchingOrders
          .map(o => o._id.toString())
          .filter(id => !existingOrderIds.includes(id));

        if (newOrderIds.length > 0) {
          shipment.orders.push(...newOrderIds);
          console.log(`✏️ Updated shipment ${shipment.shipmentId} with ${newOrderIds.length} new orders.`);
        } else {
          console.log(`ℹ️ No new orders to add to shipment ${shipment.shipmentId}.`);
        }

        shipment.trackingNumber = trackingId || shipment.trackingNumber;
        shipment.start = start || shipment.start;
        shipment.status = "Pending";

        await shipment.save();
      } else {
        shipment = new Shipment({
          shipmentId: generateShipmentId(),
          orders: matchingOrders.map(o => o._id),
          routeId,
          trackingNumber: trackingId,
          start,
          end,
          status: getRandomStatus()
        });

        await shipment.save();
        console.log(`✅ Created new shipment ${shipment.shipmentId}`);
      }

      shipments.push(shipment);
    }

    res.status(200).json({ message: "Shipments created or updated", shipments });
  } catch (err) {
    console.error("❌ Error generating shipments:", err.stack || err);
    res.status(500).json({ message: "Failed to create shipments" });
  }
};



exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate("orders")
      .sort({ createdAt: -1 });

    res.status(200).json(shipments);
  } catch (err) {
    console.error("❌ Error fetching shipments:", err.stack || err);
    res.status(500).json({ message: "Failed to fetch shipments" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId, newStatus } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const shipment = await Shipment.findOne({ orders: order._id }).populate('orders');

    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const allDelivered = shipment.orders.every(o => o.status === "Delivered");

    if (allDelivered && shipment.status !== "Delivered") {
      shipment.status = "Delivered";
      await shipment.save();
    }

    res.status(200).json({
      message: "Order status updated",
      shipmentStatus: shipment.status,
      updatedOrder: order
    });

  } catch (error) {
    console.error("❌ Error updating order status:", error.stack || error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.syncShipmentStatuses = async (req, res) => {
  try {
    const shipments = await Shipment.find().populate('orders');

    for (const shipment of shipments) {
      const allDelivered = shipment.orders.length > 0 && shipment.orders.every(o => o.status === "Delivered");

      if (allDelivered && shipment.status !== "Delivered") {
        shipment.status = "Delivered";
        await shipment.save();
        console.log(`✅ Synced status for shipment ${shipment.shipmentId}`);
      }
    }

    res.status(200).json({ message: "Shipment statuses synchronized" });
  } catch (err) {
    console.error("❌ Error syncing statuses:", err.stack || err);
    res.status(500).json({ message: "Failed to sync statuses" });
  }
};

exports.getShipmentCount = async (req, res) => {
  try {
    const count = await Shipment.countDocuments();
    res.status(200).json({ total: count });
  } catch (err) {
    console.error("❌ Error getting shipment count:", err.stack || err);
    res.status(500).json({ message: "Failed to get shipment count" });
  }
};

exports.getShipmentMetrics = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const total = await Shipment.countDocuments();

    const thisMonthCount = await Shipment.countDocuments({
      createdAt: { $gte: thisMonthStart },
    });

    const lastMonthCount = await Shipment.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    const growth =
      lastMonthCount === 0
        ? 100
        : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);

    res.status(200).json({
      total,
      monthGrowth: growth,
    });
  } catch (err) {
    console.error("❌ Error getting shipment metrics:", err.stack || err);
    res.status(500).json({ message: "Failed to get shipment metrics" });
  }
};

exports.getShipmentStatusBreakdown = async (req, res) => {
  try {
    const breakdown = await Shipment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      Delivery: 0,
      "In Transit": 0,
      Pending: 0,
      Cancelled: 0,
    };

    breakdown.forEach((entry) => {
      const key = entry._id;
      if (statusMap.hasOwnProperty(key)) {
        statusMap[key] = entry.count;
      }
    });

    res.status(200).json(statusMap);
  } catch (err) {
    console.error("❌ Error getting status breakdown:", err.stack || err);
    res.status(500).json({ message: "Failed to get shipment status breakdown" });
  }
};


