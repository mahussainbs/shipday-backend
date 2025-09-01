const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
// IMPORTANT: Replace smtp.example.com with real SMTP host (e.g. smtp.gmail.com)
// Make sure your EMAIL_USER and EMAIL_PASS are set in your .env
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',  // Example: Gmail SMTP
  port: 587,
  secure: false, // true for port 465, false for others
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Create and send notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    // Save notification to DB
    const notification = new Notification({ userId, title, message, type });
    await notification.save();

    // Send email if type is 'email'
    if (type === 'email') {
      console.log('Email notification requested.');
      const user = await User.findById(userId);
      if (!user || !user.email) {
                console.log('User or user email not found for email notification.');

        return res.status(400).json({ success: false, message: 'User email not found' });
      }

      const mailOptions = {
        from: `"YourApp Name" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: title,
        text: message,
      };
           console.log(`Sending email to ${user.email}...`);

      await transporter.sendMail(mailOptions);
    }

    // Emit socket.io event if socket is available
    const io = req.app.get('io');
    if (io) {
      const count = await Notification.countDocuments({ isRead: false });
      io.emit('new-notification', { notification, count });
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    console.error('Create Notification Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all notifications, newest first, with user fullName populated
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName'); // populate only fullName from User
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark one notification as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Clear all notifications from DB
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
