const Driver = require('../models/Driver');
const Notification = require('../models/Notification');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
// Trigger server restart for logic update
const { sendPushNotification } = require('../utils/pushNotification');

// Get drivers by vehicle type
const getDriversByVehicleType = async (req, res) => {
  const { vehicleType } = req.params;
  try {
    const drivers = await Driver.find({
      status: 'approved',
      vehicleType: vehicleType
    }).select('-password');
    res.status(200).json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all pending drivers
const getPendingDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'pending' }).select('-password');
    res.status(200).json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all accepted drivers
const getAcceptedDrivers = async (req, res) => {
  try {
    console.log('Fetching approved drivers...');
    const drivers = await Driver.find({ status: 'approved' }).select('-password');
    console.log('Found approved drivers:', drivers.length);
    res.status(200).json({ drivers });
  } catch (err) {
    console.error('Error fetching approved drivers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password');
    res.status(200).json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve/Reject driver
const updateDriverStatus = async (req, res) => {
  const { driverId, status } = req.body;
  console.log('Received:', { driverId, status });

  if (!driverId || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Valid driverId and status (approved/rejected) required' });
  }

  try {
    // First check if driver exists
    const existingDriver = await Driver.findOne({ driverId });
    if (!existingDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update the driver
    const driver = await Driver.findOneAndUpdate(
      { driverId },
      { status },
      { new: true }
    );

    // Try to create notification, but don't fail the whole operation if it fails
    try {
      const notification = new Notification({
        userId: driver._id,
        title: status === 'approved' ? 'Account Approved' : 'Account Rejected',
        message: status === 'approved'
          ? 'Your driver account has been approved. You can now start accepting deliveries.'
          : 'Your driver account has been rejected. Please contact support for more information.',
        type: 'status_update'
      });
      await notification.save();
    } catch (notificationErr) {
      console.error('Failed to create notification:', notificationErr.message);
      // Continue with success response even if notification fails
    }

    res.status(200).json({
      message: `Driver ${status} successfully`,
      driver: {
        driverId: driver.driverId,
        username: driver.username,
        status: driver.status
      }
    });
  } catch (err) {
    console.error('Error updating driver status:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create new shipment
const createShipment = async (req, res) => {
  try {
    console.log("DEBUG: createShipment called with:", JSON.stringify(req.body, null, 2));

    const {
      senderDetails, collectionDetails, deliveryDetails, parcelDetails, payment, // New Schema
      senderName, senderPhone, receiverName, receiverPhone, start, end, parcelWeight, packageType, cost, eta, notes // Legacy
    } = req.body;

    const generateShipmentId = require('../utils/generateShipmentId');
    const { generatePaymentData } = require('../utils/payfast');
    const shipmentId = await generateShipmentId();

    let shipmentData = {
      shipmentId,
      notes: notes || ''
    };

    // Check if using new detailed schema
    if (senderDetails && collectionDetails && deliveryDetails && parcelDetails) {
      // Calculate ETA based on service type
      const today = new Date();
      if (parcelDetails.serviceType === 'express') {
        today.setDate(today.getDate() + 2); // 2 days
      } else {
        today.setDate(today.getDate() + 4); // 4 days
      }

      // Populate BOTH new structure AND legacy fields together
      shipmentData = {
        ...shipmentData,
        senderDetails,
        collectionDetails,
        deliveryDetails,
        parcelDetails,
        payment: {
          ...payment,
          amount: payment?.amount || cost || 0,
          status: 'pending'
        },
        // Populate legacy fields for compatibility - REQUIRED to avoid validation error
        senderName: senderDetails.fullName || 'N/A',
        senderPhone: senderDetails.mobile || '0000000000',
        receiverName: deliveryDetails.receiverName || 'N/A',
        receiverPhone: deliveryDetails.mobile || '0000000000',
        start: collectionDetails.address.city || 'Unknown',
        end: deliveryDetails.address.city || 'Unknown',
        parcelWeight: parcelDetails.dimensions.weight || 1,
        packageType: parcelDetails.parcelType || 'parcel',
        cost: payment?.amount || cost || 0,
        eta: today
      };

    } else {
      // Legacy flow - Fallback
      console.log("DEBUG: Falling back to legacy flow");

      const etaDate = eta ? new Date(eta) : new Date();
      etaDate.setDate(etaDate.getDate() + 3); // Default 3 days

      shipmentData = {
        ...shipmentData,
        senderName: senderName || 'N/A',
        senderPhone: senderPhone || '0000000000',
        receiverName: receiverName || 'N/A',
        receiverPhone: receiverPhone || '0000000000',
        start: start || 'Unknown',
        end: end || 'Unknown',
        parcelWeight: parcelWeight || 1,
        packageType: packageType || 'parcel',
        cost: cost || 0,
        eta: etaDate,

        // Construct minimal detailed objects
        senderDetails: {
          fullName: senderName || 'N/A',
          email: 'legacy@example.com',
          mobile: senderPhone || '0000000000',
          address: { street: 'N/A', suburb: 'N/A', city: start || 'Unknown', province: 'N/A', postalCode: '0000' }
        },
        collectionDetails: {
          dispatcherName: senderName || 'N/A',
          email: 'legacy@example.com',
          mobile: senderPhone || '0000000000',
          address: { street: 'N/A', suburb: 'N/A', city: start || 'Unknown', province: 'N/A', postalCode: '0000' }
        },
        deliveryDetails: {
          receiverName: receiverName || 'N/A',
          email: 'legacy@example.com',
          mobile: receiverPhone || '0000000000',
          address: { street: 'N/A', suburb: 'N/A', city: end || 'Unknown', province: 'N/A', postalCode: '0000' }
        },
        parcelDetails: {
          serviceType: 'economy',
          parcelType: packageType || 'parcel',
          dimensions: { weight: parcelWeight || 1 }
        },
        payment: {
          amount: cost || 0,
          method: 'cod',
          status: 'pending'
        }
      };
    }

    console.log("DEBUG: Creating shipment with data:", JSON.stringify(shipmentData, null, 2));

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Generate PayFast data if payment method is gateway or wallet
    let paymentData = null;
    if (shipment.payment && (shipment.payment.method === 'gateway' || shipment.payment.method === 'wallet' || shipment.payment.method === 'payfast' || shipment.payment.method === 'ewallet')) {
      try {
        paymentData = generatePaymentData(shipment);
      } catch (e) {
        console.error("Error generating payment data:", e);
      }
    }

    res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
      paymentData
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Shipment ID already exists' });
    }
    console.error("Create Shipment Error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message, error: err.errors });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all assigned shipments
const getAssignedShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ driver: { $ne: null } })
      .populate('driver', 'username driverId')
      .sort({ createdAt: -1 });
    res.status(200).json({ shipments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign shipment to driver
const assignShipmentToDriver = async (req, res) => {
  const { shipmentId, driverId } = req.body;

  if (!shipmentId || !driverId) {
    return res.status(400).json({ message: 'shipmentId and driverId are required' });
  }

  try {
    const shipment = await Shipment.findOne({ shipmentId, status: 'Pending' });
    if (!shipment) {
      return res.status(404).json({ message: 'Pending shipment not found' });
    }

    console.log('Looking for driver with ID:', driverId);
    const driver = await Driver.findOne({
      driverId,
      status: 'approved'
    });
    console.log('Driver found:', driver);

    if (!driver) {
      return res.status(404).json({ message: 'Approved driver not found' });
    }

    const updatedShipment = await Shipment.findOneAndUpdate(
      { shipmentId },
      {
        driver: driver._id,
        driverName: driver.username,
        status: 'Shipping'
      },
      { new: true }
    ).populate('driver', 'username driverId');

    // Create notification for driver
    console.log('Creating notification for driver ObjectId:', driver._id);
    console.log('Driver details:', { driverId: driver.driverId, username: driver.username });

    const notification = new Notification({
      userId: driver._id,
      title: 'New Shipment Assigned',
      message: `Shipment ID: ${shipmentId}\nFrom: ${shipment.start}\nTo: ${shipment.end}\nPackage: ${shipment.packageType}\nWeight: ${shipment.parcelWeight}kg\nETA: ${shipment.eta}\nNotes: ${shipment.notes || 'None'}`,
      type: 'shipment_assigned'
    });

    const savedNotification = await notification.save();
    console.log('Notification saved successfully:', savedNotification._id);
    console.log('Notification userId:', savedNotification.userId);

    // Send push notification if driver has FCM token
    if (driver.fcmToken) {
      try {
        await sendPushNotification(
          driver.fcmToken,
          'New Shipment Assigned',
          `You have been assigned shipment ${shipmentId} from ${shipment.start} to ${shipment.end}`,
          {
            shipmentId,
            type: 'shipment_assigned',
            start: shipment.start,
            end: shipment.end
          }
        );
        console.log(`Push notification sent to driver ${driver.username}`);
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError.message);
      }
    } else {
      console.log(`No FCM token for driver ${driver.username}`);
    }

    // Emit socket notification
    const io = req.app?.get('io');
    if (io) {
      io.emit('shipment-assigned', {
        driverId: driver.driverId,
        shipmentId,
        notification
      });
    }

    res.status(200).json({
      message: 'Shipment assigned successfully',
      shipment: updatedShipment
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get order details by ID
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ order });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get shipment by ID
const getShipmentById = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const shipment = await Shipment.findOne({ shipmentId })
      .populate({
        path: 'driver',
        select: 'username driverId',
        options: { strictPopulate: false }
      });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.status(200).json({ shipment });
  } catch (err) {
    console.error('Error fetching shipment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all shipments
const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate({
        path: 'driver',
        select: 'username driverId',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });

    // Update driverName for shipments with assigned drivers
    const updatedShipments = shipments.map(shipment => {
      const shipmentObj = shipment.toObject();
      if (shipmentObj.driver && shipmentObj.driver.username) {
        shipmentObj.driverName = shipmentObj.driver.username;
      }
      return shipmentObj;
    });

    res.status(200).json({ shipments: updatedShipments });
  } catch (err) {
    console.error('Error fetching shipments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update shipment details
const updateShipment = async (req, res) => {
  const { shipmentId, senderName, senderPhone, receiverName, receiverPhone, start, end, parcelWeight, packageType, cost, eta, notes } = req.body;

  if (!shipmentId) {
    return res.status(400).json({ message: 'shipmentId is required' });
  }

  try {
    const updateData = {};
    if (senderName) updateData.senderName = senderName;
    if (senderPhone) updateData.senderPhone = senderPhone;
    if (receiverName) updateData.receiverName = receiverName;
    if (receiverPhone) updateData.receiverPhone = receiverPhone;
    if (start) updateData.start = start;
    if (end) updateData.end = end;
    if (parcelWeight) updateData.parcelWeight = parcelWeight;
    if (packageType) updateData.packageType = packageType;
    if (cost) updateData.cost = cost;
    if (eta) updateData.eta = new Date(eta);
    if (notes !== undefined) updateData.notes = notes;

    const shipment = await Shipment.findOneAndUpdate(
      { shipmentId },
      updateData,
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.status(200).json({
      message: 'Shipment updated successfully',
      shipment
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete shipment
const deleteShipment = async (req, res) => {
  const { shipmentId } = req.params;

  if (!shipmentId) {
    return res.status(400).json({ message: 'shipmentId is required' });
  }

  try {
    const shipment = await Shipment.findOneAndDelete({ shipmentId });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.status(200).json({
      message: 'Shipment deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Generate Waybill PDF
const downloadWaybill = async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const { generateWaybill } = require('../utils/pdfGenerator');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=waybill-${shipmentId}.pdf`);
    generateWaybill(shipment, res);
  } catch (err) {
    console.error('Error generating waybill:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate POD PDF
const downloadPOD = async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const { generatePOD } = require('../utils/pdfGenerator');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pod-${shipmentId}.pdf`);
    generatePOD(shipment, res);
  } catch (err) {
    console.error('Error generating POD:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPendingDrivers,
  getAcceptedDrivers,
  getAllDrivers,
  updateDriverStatus,
  createShipment,
  getOrderDetails,
  getShipmentById,
  assignShipmentToDriver,
  getAssignedShipments,
  getAllShipments,
  getDriversByVehicleType,
  updateShipment,
  deleteShipment,
  downloadWaybill,
  downloadPOD
};