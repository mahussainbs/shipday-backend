const jwt = require('jsonwebtoken');
const Token = require('../models/Token');
const User = require('../models/User');
 
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token' });
  }
 
  const token = authHeader.split(' ')[1];
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    // Check if token still exists in DB
    const tokenDoc = await Token.findOne({ token, userId: decoded.id });
    if (!tokenDoc) {
      return res.status(401).json({ message: 'Unauthorized: Token invalid or expired' });
    }
 
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
 
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
 
module.exports = authMiddleware;