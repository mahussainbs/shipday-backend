// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
      tokens: [{ type: String }], // ✅ Multi-device support


    // ✅ Add these profile fields:
    fullName: String,
    nickName: String,
    dob: String,
    phone: String,
    gender: String,
    image: String, 
    location: {
      latitude: Number,
      longitude: Number,
      address: String, // Optional address field
    },
  },
  
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
