const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const corsMiddleware = require('./config/cors');
const { initializeSocket } = require('./config/socket');

const app = express();
const PORT = process.env.PORT || process.env.WEBSITES_PORT || 5000;

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


// DB Connection Logic
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1);
  }
};

// Export the app for Vercel
module.exports = app;

// Start server only if run directly (local dev)
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
} else {
  // For Vercel, ensure DB is connected before handling requests
  // Note: Vercel might re-use the frozen instance, so we check connection state above
  connectDB();
} 