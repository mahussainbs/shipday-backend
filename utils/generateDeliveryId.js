const Delivery = require("../models/Delivery");

const generateDeliveryId = async () => {
  const last = await Delivery.findOne().sort({ createdAt: -1 });

  if (!last) return "DEL-001";
  const num = parseInt(last.deliveryId.split("-")[1]) + 1;
  return `DL-${String(num).padStart(3, "0")}`;
};

module.exports = generateDeliveryId;
