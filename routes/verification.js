const express = require('express');
const router = express.Router();
const VerificationCode = require('../models/VerificationCode');

// POST /api/verify-code
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" });
  }

  try {
    const record = await VerificationCode.findOne({ email });

    if (!record) {
      return res.status(400).json({ message: "Verification code not found" });
    }

    if (record.expiresAt < new Date()) {
      await VerificationCode.deleteOne({ email });
      return res.status(400).json({ message: "Verification code expired" });
    }

    if (record.code !== code.toUpperCase()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    return res.status(200).json({ message: "Code verified successfully" });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ message: "Server error verifying code" });
  }
});

module.exports = router;
