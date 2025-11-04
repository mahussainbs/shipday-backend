const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const corsMiddleware = require('./config/cors');
const { initializeSocket } = require('./config/socket');

const app = express();
const PORT = process.env.PORT || 5000;

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
 
// Use routes
app.use('/api', routes);
 
// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ DB Connection Error:', err.message));
 