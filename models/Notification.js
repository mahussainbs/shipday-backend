const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Who triggered it
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['order', 'registration', 'login', 'forgot-password','transactiom', 'email', 'sms', 'webPush'], required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
