const socketIo = require('socket.io');

const allowedOrigins = [
  'http://localhost:5173',
  'https://lemon-moss-0af8f730f.1.azurestaticapps.net',
  'http://192.168.0.54:8081',
  'http://192.168.0.54:5000',
];

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"]
    },
    transports: ["websocket"],
  });

  return io;
};

module.exports = { initializeSocket };