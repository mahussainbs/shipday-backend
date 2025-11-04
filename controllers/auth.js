const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const sendMail = require("../utils/mail");
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const validateEmail = (email) => {
  const sanitized = String(email).toLowerCase().trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(sanitized) ? sanitized : null;
};

const sendVerificationCode = async (email) => {
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await VerificationCode.findOneAndUpdate(
    { email },
    { code, expiresAt },
    { upsert: true, new: true }
  );

  const text = `Your verification code is: ${code}. It will expire in 15 minutes.`;
  await sendMail(email, "Your Verification Code", text);
};

const generateCustomerId = async () => {
  const count = await User.countDocuments();
  const nextNumber = count + 1;
  const padded = String(nextNumber).padStart(3, '0');
  return `CUST${padded}`;
};

const requestVerificationCode = async (req, res) => {
  const { email, source } = req.body;
  const sanitizedEmail = validateEmail(email);
  if (!sanitizedEmail) return res.status(400).json({ message: 'Valid email is required' });

  try {
    const userExists = await User.findOne({ email: sanitizedEmail });

    if (source === 'register' && userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (source === 'forgot' && !userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await sendVerificationCode(sanitizedEmail);
    res.status(200).json({ message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const sanitizedEmail = validateEmail(email);
  if (!sanitizedEmail || !code)
    return res.status(400).json({ message: 'Valid email and code are required' });

  try {
    const record = await VerificationCode.findOne({ email: sanitizedEmail });
    if (!record)
      return res.status(400).json({ message: 'Verification code not found' });

    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteOne({ email: sanitizedEmail });
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (record.code !== code.toUpperCase())
      return res.status(400).json({ message: 'Invalid verification code' });

    await VerificationCode.deleteOne({ email: sanitizedEmail });
    res.status(200).json({ message: 'Verification successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const registerUser = async (req, res) => {
  const { email, password, code } = req.body;
  const sanitizedEmail = validateEmail(email);

  if (!sanitizedEmail || !password || !code)
    return res.status(400).json({ message: 'Valid email, password, and code are required' });

  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    });
  }

  try {
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const record = await VerificationCode.findOne({ email: sanitizedEmail });
    if (!record || record.expiresAt < new Date() || record.code !== code.toUpperCase()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    await VerificationCode.deleteOne({ email: sanitizedEmail });

    const customerId = await generateCustomerId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: sanitizedEmail,
      password: hashedPassword,
      customerId,
    });

    await user.save();

    const notification = new Notification({
      userId: user._id,
      title: "Welcome to SwiftShip",
      message: `Your account (${sanitizedEmail}) has been successfully registered.`,
      type: "registration"
    });
    await notification.save();

    res.status(201).json({ message: 'User registered successfully', customerId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = validateEmail(email);

  if (!sanitizedEmail || !password)
    return res.status(400).json({ message: 'Valid email and password are required' });

  try {
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

    const tokenDoc = await Token.create({ userId: user._id, token });
    tokenDoc.expiresAt = new Date(tokenDoc.createdAt.getTime() + 1 * 60 * 1000);
    await tokenDoc.save();

    const notification = new Notification({
      userId: user._id,
      title: "Login Successful",
      message: "You have logged in to your account.",
      type: "login"
    });
    await notification.save();

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { email: user.email, customerId: user.customerId },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login error' });
  }
};

const logoutUser = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    await Token.deleteOne({ token });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const sanitizedEmail = validateEmail(email);

  if (!sanitizedEmail || !newPassword) {
    return res.status(400).json({ message: 'Valid email and new password are required' });
  }

  if (!strongPasswordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
    });
  }

  try {
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await Token.deleteMany({ userId: user._id });

    const notification = new Notification({
      userId: user._id,
      title: "Password Reset",
      message: `Your account password has been successfully reset.`,
      type: "forgot-password"
    });
    await notification.save();

    res.status(200).json({ message: 'Password reset successful. Please log in again.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

const updateUserProfile = async (req, res) => {
  const { email, fullName, nickName, dob, phone, gender, image } = req.body;
  const sanitizedEmail = validateEmail(email);

  if (!sanitizedEmail) return res.status(400).json({ message: 'Valid email is required' });

  try {
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.fullName = fullName || user.fullName;
    user.nickName = nickName || user.nickName;
    user.dob = dob || user.dob;
    user.phone = phone || user.phone;
    user.gender = gender || user.gender;
    user.image = image || user.image;

    await user.save();
    
    const notification = new Notification({
      userId: user._id,
      title: "profile update",
      message: `Your account (${sanitizedEmail}) has been successfully updated.`,
      type: "registration"
    });
    await notification.save();
    
    res.status(200).json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

const getUserByEmail = async (req, res) => {
  const sanitizedEmail = validateEmail(req.query.email);
  if (!sanitizedEmail) return res.status(400).json({ message: 'Valid email is required' });

  try {
    const user = await User.findOne({ email: sanitizedEmail }).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const users = await User.find();
    const orders = await Order.find();

    const enrichedUsers = users.map((user) => {
      const userOrders = orders.filter(
        (order) =>
          order.senderEmail === user.email || order.senderPhone === user.phone
      );

      return {
        customerId: user.customerId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        totalOrders: userOrders.length,
      };
    });

    res.status(200).json({ customers: enrichedUsers });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  requestVerificationCode,
  verifyCode,
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  updateUserProfile,
  getUserByEmail,
  getAllCustomers
};