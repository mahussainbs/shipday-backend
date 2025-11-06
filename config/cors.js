const cors = require('cors');

// Simplified CORS for Azure deployment
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://lemon-moss-0af8f730f.1.azurestaticapps.net',
    'http://192.168.0.54:8081',
    'http://192.168.0.54:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);