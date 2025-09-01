const mongoose = require('mongoose');

const CompanyInfoSchema = new mongoose.Schema({
  logo: { type: String, default: null }, // store filename or base64 string
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  preferences: {
    currency: { type: String, required: true },
    timezone: { type: String, required: true },
    language: { type: String, required: true },
  }
}, { timestamps: true });

module.exports = mongoose.model('CompanyInfo', CompanyInfoSchema);
