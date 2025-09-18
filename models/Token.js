const mongoose = require('mongoose');
 
const tokenSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  token: String,
  expiresAt: { type: Date, index: { expires: 0 } } // auto-delete after expiry
}, { timestamps: true }); // adds createdAt & updatedAt automatically
 
module.exports = mongoose.model('Token', tokenSchema);