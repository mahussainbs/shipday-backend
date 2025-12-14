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

// DB Connection
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('❌ MONGO_URI environment variable is not set');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
  }
};

// Connect to DB (async, non-blocking)
connectDB();

// Start Server IMMEDIATELY to satisfy Railway health check
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});