const express = require('express');
const http = require('http');           
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cors());

// Import all routes from routes/index.js
const routes = require('./routes');

// Socket setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',  
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
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));
