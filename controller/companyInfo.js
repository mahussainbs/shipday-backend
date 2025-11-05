const CompanyInfo = require('../models/CompanyInfo');

// Get company info
exports.getCompanyInfo = async (req, res) => {
  try {
    const info = await CompanyInfo.findOne();
    res.json(info || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save or update company info
exports.saveCompanyInfo = async (req, res) => {
  try {
    let info = await CompanyInfo.findOne();
    if (info) {
      info.set(req.body);
    } else {
      info = new CompanyInfo(req.body);
    }
    await info.save();
    res.json(info);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
