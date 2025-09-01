const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

// 📌 Get wallet data
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.params.userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Add transaction and update balance
exports.addTransaction = async (req, res) => {
  try {
    const { userId, type, amount, description } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

let wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!wallet) {
      wallet = new Wallet({ userId: objectUserId, balance: 0, transactions: [] });
    }

    if (type === 'debit' && wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Update balance
    wallet.balance = type === 'credit'
      ? wallet.balance + amount
      : wallet.balance - amount;

    // Add transaction
    wallet.transactions.push({ type, amount, description });

    await wallet.save();

    res.status(201).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
