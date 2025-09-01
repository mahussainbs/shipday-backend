const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  txnId: {
    type: String,
    required: true,
    unique: true,
  },
  customer: String,
  type: {
    type: String,
    enum: ["Credit", "Debit"],
  },
  orderId: {
    type: String, 
  },
  amount: Number,
  method: {
    type: String,
    enum: ["UPI", "Bank Transfer", "Card", "Wallet", "COD"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Completed", "Pending", "Failed"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
