const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const Driver = require('../models/Driver');
require('dotenv').config();

const updateDriverNames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all shipments with assigned drivers but incorrect driverName
    const shipments = await Shipment.find({ 
      driver: { $ne: null },
      driverName: "Unassigned"
    }).populate('driver');

    console.log(`Found ${shipments.length} shipments to update`);

    for (const shipment of shipments) {
      if (shipment.driver) {
        await Shipment.findByIdAndUpdate(shipment._id, {
          driverName: shipment.driver.username
        });
        console.log(`Updated shipment ${shipment.shipmentId} with driver ${shipment.driver.username}`);
      }
    }

    console.log('Update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateDriverNames();