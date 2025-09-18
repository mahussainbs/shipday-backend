const express = require('express');
const http = require('http');          
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 5000;
 
// ✅ Define allowed origins (only your frontend domains)
const allowedOrigins = [
  'http://localhost:5173',          // Dev (Vite default port)
  'https://lemon-moss-0af8f730f.1.azurestaticapps.net' // Prod
];
 
// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
 
// ✅ Secure CORS config
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
 
// Import all routes from routes/index.js
const routes = require('./routes');
 
// Socket setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  },
  transports: ["websocket"],
});
 
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
 