const cron = require("node-cron");
const { generateShipments } = require("../controller/shipmentController");
const { autoCreateDeliveries } = require("../controller/deliveryController");

const scheduleJobs = () => {
  // Run every 10 seconds
  cron.schedule("*/10 * * * * *", async () => {
    console.log("⏱️ Running auto shipment generation every 10 seconds...");

    try {
      const req = {}; // Dummy request
      const res = {
        status: (code) => ({
          json: (data) =>
            console.log("✔️ Shipment generation response"),
        }),
      };

      await generateShipments(req, res);
      await autoCreateDeliveries();
    } catch (err) {
      console.error("❌ Error running scheduled shipment generation:", err);
    }
  });
};

module.exports = scheduleJobs;
