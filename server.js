const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const corsMiddleware = require('./config/cors');
const { initializeSocket } = require('./config/socket');

const app = express();
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 5000;

// --- DEBUGGING START ---
console.log("🔍 --- DEBUGGING ENVIRONMENT VARIABLES ---");
console.log("Current Environment Keys:", Object.keys(process.env).sort());
console.log("MONGO_URI Type:", typeof process.env.MONGO_URI);
console.log("STRIPE_KEY Present:", !!process.env.STRIPE_SECRET_KEY);
console.log("🔍 --- DEBUGGING END ---");
// --- DEBUGGING END ---

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(corsMiddleware);

// Import routes
const routes = require('./routes');

// Socket setup
const server = http.createServer(app);
const io = initializeSocket(server);

// Make io accessible
app.set('io', io);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Swift Ship API is running', timestamp: new Date().toISOString() });
});

// Use routes
app.use('/api', routes);


// DB Connection
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set');
  // process.exit(1); // COMMENTED OUT FOR DEPLOYMENT DEBUGGING
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB Connection Error:', err.message);
    // process.exit(1); // COMMENTED OUT FOR DEPLOYMENT DEBUGGING

    // Start server anyway so we can see logs/status
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} (WITHOUT DB)`);
    });
  });