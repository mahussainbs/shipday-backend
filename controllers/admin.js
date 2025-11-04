const Driver = require('../models/Driver');
const Notification = require('../models/Notification');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');

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

const getPendingDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'pending' }).select('-password');
    res.status(200).json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAcceptedDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'approved' }).select('-password');
    res.status(200).json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({}).select('-password');
    res.status(200).json({ drivers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDriverStatus = async (req, res) => {
  const { driverId, status } = req.body;
  
  if (!driverId || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Valid driverId and status (approved/rejected) required' });
  }

  try {
    const existingDriver = await Driver.findOne({ driverId });
    if (!existingDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driver = await Driver.findOneAndUpdate(
      { driverId },
      { status },
      { new: true }
    );

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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createShipment = async (req, res) => {
  const { senderName, senderPhone, receiverName, receiverPhone, start, end, parcelWeight, packageType, cost, eta, notes } = req.body;
  
  if (!senderName || !senderPhone || !receiverName || !receiverPhone || !start || !end || !parcelWeight || !packageType || !cost || !eta) {
    return res.status(400).json({ message: 'senderName, senderPhone, receiverName, receiverPhone, start, end, parcelWeight, packageType, cost, and eta are required' });
  }

  try {
    const generateShipmentId = require('../utils/generateShipmentId');
    const shipmentId = await generateShipmentId();
    
    const shipment = new Shipment({
      shipmentId,
      senderName,
      senderPhone,
      receiverName,
      receiverPhone,
      start,
      end,
      parcelWeight,
      packageType,
      cost,
      eta: new Date(eta),
      notes: notes || ''
    });

    await shipment.save();
    res.status(201).json({ 
      message: 'Shipment created successfully',
      shipment
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Shipment ID already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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

    const driver = await Driver.findOne({ 
      driverId, 
      status: 'approved'
    });
    
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

    const notification = new Notification({
      userId: driver._id,
      title: 'New Shipment Assigned',
      message: `Shipment ID: ${shipmentId}\nFrom: ${shipment.start}\nTo: ${shipment.end}\nPackage: ${shipment.packageType}\nWeight: ${shipment.parcelWeight}kg\nETA: ${shipment.eta}\nNotes: ${shipment.notes || 'None'}`,
      type: 'shipment_assigned'
    });
    await notification.save();

    res.status(200).json({ 
      message: 'Shipment assigned successfully',
      shipment: updatedShipment
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate({
        path: 'driver',
        select: 'username driverId',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });
    
    const updatedShipments = shipments.map(shipment => {
      const shipmentObj = shipment.toObject();
      if (shipmentObj.driver && shipmentObj.driver.username) {
        shipmentObj.driverName = shipmentObj.driver.username;
      }
      return shipmentObj;
    });
    
    res.status(200).json({ shipments: updatedShipments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateShipment = async (req, res) => {
  const { shipmentId } = req.params;
  
  if (!shipmentId) {
    return res.status(400).json({ message: 'shipmentId is required' });
  }

  try {
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateData[key] = key === 'eta' ? new Date(req.body[key]) : req.body[key];
      }
    });

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

const deleteShipment = async (req, res) => {
  const { shipmentId } = req.params;
  
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

module.exports = {
  getPendingDrivers,
  getAcceptedDrivers,
  getAllDrivers,
  updateDriverStatus,
  createShipment,
  assignShipmentToDriver,
  getAllShipments,
  getShipmentById,
  getDriversByVehicleType,
  updateShipment,
  deleteShipment
};