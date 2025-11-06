const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://lemon-moss-0af8f730f.1.azurestaticapps.net',
  'http://192.168.0.54:8081',
  'http://192.168.0.54:5000',
  process.env.PRODUCTION_FRONTEND_URL,
  process.env.MOBILE_APP_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = cors(corsOptions);