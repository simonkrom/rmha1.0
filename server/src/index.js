require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const { pool, runMigrations } = require('./db');
const { createAuth } = require('./services/auth');
const { createAudit } = require('./services/audit');
const { requireAuth, requireRole } = require('./middleware/permissions');

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';

const auth = createAuth(pool, JWT_SECRET);
const audit = createAudit(pool);

const app = express();
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://laboratoire-frontend.onrender.com',
  'https://laboratoire-backend.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(morgan('tiny'));
app.use(express.json());

// Serve frontend static files (pages and assets) so backend can host the full app
const frontendRoot = path.join(__dirname, '..', '..');
app.use('/assets', express.static(path.join(frontendRoot, 'assets')));
app.use('/', express.static(path.join(frontendRoot, 'pages')));

// HTTP + Socket.IO setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// expose io on app so other modules could use it if needed
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (role) => {
    try {
      if (role) socket.join(role);
    } catch (e) {
      console.error('join error', e);
    }
  });

  socket.on('newRegistration', (patient) => {
    // broadcast
    io.to('admin').emit('activity', { type: 'registration', patient });
    io.to('manager').emit('newRegistration', patient);
    // persist audit
    try {
      audit.log({ action: 'newRegistration', resource: 'patient', meta: patient });
    } catch (e) {
      console.error('audit log error (newRegistration)', e && e.message);
    }
  });

  socket.on('newOrder', (order) => {
    io.to('manager').emit('newOrder', order);
    io.to('admin').emit('activity', { type: 'newOrder', order });
    if (order.services && order.services.includes && order.services.includes('pharmacie')) {
      io.to('pharmacien').emit('newOrder', order);
    }
    if (order.services && order.services.includes && order.services.includes('laboratoire')) {
      io.to('laboratoire').emit('newOrder', order);
    }
    // always notify coursier to pick up/deliver
    io.to('coursier').emit('newOrder', order);

    // persist audit
    try {
      audit.log({ action: 'newOrder', resource: 'order', meta: order });
    } catch (e) {
      console.error('audit log error (newOrder)', e && e.message);
    }
  });

  socket.on('orderValidated', (data) => {
    io.to('admin').emit('activity', { type: 'orderValidated', data });
    io.to('manager').emit('orderValidated', data);
    io.to('coursier').emit('orderValidated', data);
    try {
      audit.log({ action: 'orderValidated', resource: 'order', meta: data });
    } catch (e) {
      console.error('audit log error (orderValidated)', e && e.message);
    }
  });

  socket.on('orderPrepared', (data) => {
    io.to('admin').emit('activity', { type: 'orderPrepared', data });
    io.to('manager').emit('orderPrepared', data);
    io.to('coursier').emit('orderPrepared', data);
    try {
      audit.log({ action: 'orderPrepared', resource: 'order', meta: data });
    } catch (e) {
      console.error('audit log error (orderPrepared)', e && e.message);
    }
  });

  // Courier position updates (high frequency) - broadcast to managers and admins
  socket.on('courierPosition', (pos) => {
    try {
      io.to('manager').emit('courierPosition', pos);
      io.to('admin').emit('courierPosition', pos);
      // Optional: persist lower-frequency or important events only
      // audit.log({ action: 'courierPosition', resource: 'courier', meta: pos });
    } catch (e) {
      console.error('courierPosition broadcast error', e && e.message);
    }
  });
});

// Mount route modules
const authRoutes = require('./routes/auth')(auth, audit, pool, requireAuth);
const adminRoutes = require('./routes/admin')(auth, audit, pool, requireAuth, requireRole);
const patientsRoutes = require('./routes/patients')(auth, audit, pool);

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', patientsRoutes);

// Fallback for client-side routes: serve index.html for non-API requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(frontendRoot, 'pages', 'index.html'));
});

(async () => {
  try {
    await runMigrations();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err && err.message);
    process.exit(1);
  }
})();
