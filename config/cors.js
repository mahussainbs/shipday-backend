const cors = require('cors');

// Simplified CORS for Azure deployment
const corsOptions = {
  // Allow all origins for Vercel deployment troubleshooting
  // You can restrict this later once you have the final URL
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);