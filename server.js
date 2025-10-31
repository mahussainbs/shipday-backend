// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

/** Allowlist: add only the real frontends */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://lemon-moss-0af8f730f.1.azurestaticapps.net',
  'https://swiftship.vercel.app',
];

/** Trust proxy (Azure/App Service sits behind a proxy) */
app.set('trust proxy', 1);

/** Basic hardening */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

/** Body parsing */
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

/**
 * 🔑 Critical: explicit CORS headers + fast path for OPTIONS.
 * This guarantees the browser sees ACAO/ACAM/ACAH even if other
 * middleware/routes would redirect or short-circuit.
 */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    // keep if you use cookies/sessions; remove if using pure bearer tokens
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Requested-With'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      req.headers['access-control-request-method'] || 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    // optional: cache preflight for 10 minutes
    res.setHeader('Access-Control-Max-Age', '600');
  }

  // Never redirect or block preflight
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/** cors() for normal requests (keeps error shapes consistent) */
app.use(
  cors({
    origin: (origin, cb) => (!origin || ALLOWED_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
    credentials: true,
  })
);

/** Health checks (useful for Azure) */
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/readyz', (req, res) => res.json({ ready: true }));

/** Routes */
const routes = require('./routes'); // your existing router
app.use('/api', routes);

/** HTTP + WebSocket */
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, cb) => (!origin || ALLOWED_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('WS origin not allowed'))),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'], // as you had
});
app.set('io', io);

/** 404 (after routes) */
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

/** Centralized error handler (keeps CORS headers already set above) */
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

/** DB + start */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1);
  });

/** Graceful shutdown */
process.on('SIGTERM', () => {
  console.log('🔻 Shutting down...');
  server.close(() => mongoose.connection.close(false, () => process.exit(0)));
});
