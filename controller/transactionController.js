const Transaction = require("../models/Transaction");
const { v4: uuidv4 } = require("uuid");

// controllers/transactionController.js

exports.createTransaction = async (req, res) => {
  try {
    const { customer, type, amount, method, status, orderId } = req.body;

    const customerName =
      typeof customer === "object" && customer.fullName
        ? customer.fullName
        : customer;

    if (!customerName || !type || !amount || !method || !status || !orderId) {
      return res.status(400).json({ error: "All fields are required, including orderId" });
    }

    const txnId = "TXN-" + uuidv4().slice(0, 5).toUpperCase();

    const newTransaction = new Transaction({
      txnId,
      customer: customerName,
      type,
      amount,
      method,
      status,
      orderId, // ✅ include orderId here
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Server Error" });
  }
};


exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
// controller/transactionController.js
exports.getTotalRevenue = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      }
    ]);

    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

    res.json({ totalRevenue });
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// controller/transactionController.js

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // day before this month

    const [lastMonth] = await Transaction.aggregate([
      {
        $match: {
          status: "Completed",
          date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amount" }
        }
      }
    ]);

    const [currentMonth] = await Transaction.aggregate([
      {
        $match: {
          status: "Completed",
          date: { $gte: startOfCurrentMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amount" }
        }
      }
    ]);

    res.json({
      currentMonthRevenue: currentMonth?.revenue || 0,
      lastMonthRevenue: lastMonth?.revenue || 0
    });
  } catch (error) {
    console.error("Error fetching monthly revenues:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getMonthlyRevenueBreakdown = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "Completed" } },
      {
        $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const revenueByMonth = Array(12).fill(0);
    result.forEach(item => {
      revenueByMonth[item._id.month - 1] = item.total;
    });

    res.json({ revenueByMonth });
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
