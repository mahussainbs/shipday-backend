const Driver = require('../models/Driver');
const TempDriver = require('../models/TempDriver');
const VerificationCode = require('../models/VerificationCode');
const Notification = require('../models/Notification');
const Delivery = require('../models/Delivery');
const Shipment = require('../models/Shipment');
const sendMail = require("../utils/mail");
const Token = require('../models/Token');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password strength regex
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// Email validator
const validateEmail = (email) => {
  const sanitized = String(email).toLowerCase().trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(sanitized) ? sanitized : null;
};

// Generate unique driverId
const generateDriverId = async () => {
  let driverId;
  let isUnique = false;
  let counter = 1;
  
  while (!isUnique) {
    const padded = String(counter).padStart(3, '0');
    driverId = `DRV${padded}`;
    
    const existing = await Driver.findOne({ driverId });
    if (!existing) {
      isUnique = true;
    } else {
      counter++;
    }
  }
  
  return driverId;
};

// Helper to create notification
const createNotification = async (driverId, title, message, type) => {
  try {
    const notification = new Notification({
      userId: driverId,
      title,
      message,
      type,
    });
    await notification.save();
  } catch (err) {
    console.error("Notification creation failed:", err);
  }
};

// Send verification code
const sendVerificationCode = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

  await VerificationCode.findOneAndUpdate(
    { email },
    { code, expiresAt },
    { upsert: true, new: true }
  );

  const text = `Your driver verification code is: ${code}. It will expire in 15 minutes.`;
  await sendMail(email, "Driver Verification Code", text);
};

// Verify OTP and create driver account
const requestDriverVerificationCode = async (req, res) => {
  const { email, code } = req.body;
  const sanitizedEmail = validateEmail(email);
  
  if (!sanitizedEmail || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    const record = await VerificationCode.findOne({ email: sanitizedEmail });
    if (!record) {
      return res.status(400).json({ message: 'Verification code not found' });
    }

    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteOne({ email: sanitizedEmail });
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (record.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Get temp driver data
    const tempDriver = await TempDriver.findOne({ email: sanitizedEmail });
    if (!tempDriver) {
      return res.status(400).json({ message: 'Registration data not found. Please register again.' });
    }

    // Create driver
    const driverId = await generateDriverId();
    const driver = new Driver({
      driverId,
      username: tempDriver.username,
      email: tempDriver.email,
      phone: tempDriver.phone,
      password: tempDriver.password,
      vehicleType: tempDriver.vehicleType,
      vehicleNumber: tempDriver.vehicleNumber,
      idProof: tempDriver.idProof,
    });

    await driver.save();

    // Cleanup
    await VerificationCode.deleteOne({ email: sanitizedEmail });
    await TempDriver.deleteOne({ email: sanitizedEmail });

    await createNotification(
      driver._id,
      "Driver Registration Successful",
      `Welcome ${tempDriver.username}! Your driver account has been registered and is pending approval.`,
      "registration"
    );

    res.status(201).json({ 
      message: 'Driver registered successfully. Account is pending approval.',
      driverId: driver.driverId 
    });
  } catch (err) {
    console.error('Verification error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Driver already exists' });
    }
    res.status(500).json({ message: 'Verification failed' });
  }
};

// Register driver (collect details and send OTP)
const registerDriver = async (req, res) => {
  const { username, email, phone, password, vehicleType, vehicleNumber, idProof } = req.body;
  const sanitizedEmail = validateEmail(email);
  
  if (!username || !sanitizedEmail || !phone || !password || !vehicleType || !vehicleNumber || (!req.file && !idProof)) {
    return res.status(400).json({ message: 'All fields including ID proof are required' });
  }

  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    });
  }

  if (!['bike', 'car', 'van', 'truck'].includes(vehicleType)) {
    return res.status(400).json({ message: 'Invalid vehicle type' });
  }

  try {
    const existingDriver = await Driver.findOne({ 
      $or: [
        { email: sanitizedEmail },
        { vehicleNumber: vehicleNumber.trim() }
      ]
    });
    
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver already exists with this email or vehicle number' });
    }

    // Store temp driver data
    const hashedPassword = await bcrypt.hash(password, 10);
    await TempDriver.findOneAndUpdate(
      { email: sanitizedEmail },
      {
        username: username.trim(),
        email: sanitizedEmail,
        phone: phone.trim(),
        password: hashedPassword,
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        idProof: req.file ? req.file.path : idProof
      },
      { upsert: true, new: true }
    );

    await sendVerificationCode(sanitizedEmail);
    res.status(200).json({ message: 'Verification code sent to email. Please verify to complete registration.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

// Driver login
const loginDriver = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: 'Email/phone and password are required' });
  }

  try {
    const sanitizedEmail = validateEmail(emailOrPhone);
    const driver = await Driver.findOne({
      $or: [
        { email: sanitizedEmail || emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!driver) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (driver.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get delivery statistics
    const assignedDeliveries = await Delivery.countDocuments({ driverName: driver.username, status: 'assigned' });
    const completedDeliveries = await Delivery.countDocuments({ driverName: driver.username, status: 'delivered' });
    const pendingDeliveries = await Delivery.countDocuments({ driverName: driver.username, status: { $in: ['in_transit', 'picked_up'] } });
    
    // Calculate earnings (assuming each delivery has a fixed rate)
    const earnings = completedDeliveries * 50; // $50 per delivery

    const token = jwt.sign(
      { id: driver._id, email: driver.email, role: 'driver' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '2h' }
    );

    await createNotification(
      driver._id, 
      "Login Successful", 
      "You have logged in to your driver account.", 
      "login"
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      driver: { 
        driverId: driver.driverId,
        username: driver.username,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        status: driver.status
      },
      statistics: {
        assignedDeliveries,
        completedDeliveries,
        pendingDeliveries,
        earnings
      }
    });
  } catch (err) {
    console.error('Driver login error:', err);
    res.status(500).json({ message: 'Login error' });
  }
};

// Get driver notifications
const getDriverNotifications = async (req, res) => {
  const { driverId } = req.params;
  
  try {
    console.log('Looking for driver with ID:', driverId);
    const driver = await Driver.findOne({ driverId });
    console.log('Driver found:', driver ? 'Yes' : 'No');
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    console.log('Driver ObjectId:', driver._id);
    const notifications = await Notification.find({ userId: driver._id })
      .sort({ createdAt: -1 });
    
    console.log('Notifications found:', notifications.length);
    res.status(200).json({ notifications });
  } catch (err) {
    console.error('Error in getDriverNotifications:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get driver's assigned shipments
const getDriverShipments = async (req, res) => {
  const { driverId } = req.params;
  
  try {
    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const shipments = await Shipment.find({ driver: driver._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ shipments });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update shipment status by driver
const updateShipmentStatus = async (req, res) => {
  const { shipmentId, status } = req.body;
  
  if (!shipmentId || !status) {
    return res.status(400).json({ message: 'shipmentId and status are required' });
  }

  if (!['Delivered'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Only "Delivered" is allowed' });
  }

  try {
    const shipment = await Shipment.findOneAndUpdate(
      { shipmentId, status: 'Shipping' },
      { status, deliveredAt: new Date() },
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ message: 'Shipping shipment not found' });
    }

    res.status(200).json({ 
      message: 'Shipment status updated successfully',
      shipment
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update driver FCM token
const updateDriverFCMToken = async (req, res) => {
  const { driverId } = req.params;
  const { fcmToken } = req.body;
  
  if (!fcmToken) {
    return res.status(400).json({ message: 'FCM token is required' });
  }

  try {
    const driver = await Driver.findOneAndUpdate(
      { driverId },
      { fcmToken },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json({ 
      message: 'FCM token updated successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Test push notification
const testPushNotification = async (req, res) => {
  const { driverId } = req.params;
  
  try {
    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (!driver.fcmToken) {
      return res.status(400).json({ message: 'Driver has no FCM token' });
    }

    const { sendPushNotification } = require('../utils/pushNotification');
    await sendPushNotification(
      driver.fcmToken,
      'Test Notification',
      'This is a test push notification for driver ' + driver.username,
      { type: 'test' }
    );

    res.status(200).json({ 
      message: 'Test push notification sent successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Check if driver exists
const checkDriver = async (req, res) => {
  const { driverId } = req.params;
  
  try {
    const driver = await Driver.findOne({ driverId }).select('-password');
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json({ 
      message: 'Driver found',
      driver
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Forgot password - send reset code
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const sanitizedEmail = validateEmail(email);
  
  if (!sanitizedEmail) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  try {
    const driver = await Driver.findOne({ email: sanitizedEmail });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found with this email' });
    }

    await sendVerificationCode(sanitizedEmail);
    res.status(200).json({ message: 'Password reset code sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send reset code' });
  }
};

// Reset password with verification code
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const sanitizedEmail = validateEmail(email);
  
  if (!sanitizedEmail || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, verification code, and new password are required' });
  }

  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    });
  }

  try {
    const record = await VerificationCode.findOne({ email: sanitizedEmail });
    if (!record) {
      return res.status(400).json({ message: 'Verification code not found' });
    }

    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteOne({ email: sanitizedEmail });
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (record.code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const driver = await Driver.findOne({ email: sanitizedEmail });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Driver.findOneAndUpdate(
      { email: sanitizedEmail },
      { password: hashedPassword }
    );

    await VerificationCode.deleteOne({ email: sanitizedEmail });

    await createNotification(
      driver._id,
      "Password Reset Successful",
      "Your password has been successfully reset.",
      "security"
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Password reset failed' });
  }
};

module.exports = {
  requestDriverVerificationCode,
  registerDriver,
  loginDriver,
  getDriverNotifications,
  getDriverShipments,
  updateShipmentStatus,
  updateDriverFCMToken,
  testPushNotification,
  checkDriver,
  forgotPassword,
  resetPassword,
};