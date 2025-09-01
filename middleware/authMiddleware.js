const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adjust path as needed

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by decoded id
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    // Optional: Check if token matches stored token (handle logout/token invalidation)
    if (!user.tokens.includes(token)) {
      return res.status(401).json({ message: 'Unauthorized: Token invalidated' });
    }

    req.user = user; // Attach full user object for controllers
    next();

  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
