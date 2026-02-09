const { pool, runMigrations } = require('./db');
const { createAuth } = require('./services/auth');
const { createAudit } = require('./services/audit');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const { requireAuth, requireRole } = require('./middleware/permissions');

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me';

async function createApp() {
  const auth = createAuth(pool, JWT_SECRET);
  const audit = createAudit(pool);
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(morgan('tiny'));
  app.use(express.json());

  const authRoutes = require('./routes/auth')(auth, audit, pool, requireAuth);
  const adminRoutes = require('./routes/admin')(auth, audit, pool, requireAuth, requireRole);
  const patientsRoutes = require('./routes/patients')(auth, audit, pool);
  app.use('/api', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', patientsRoutes);

  return app;
}

async function startAppForTests() {
  await runMigrations();
  const app = await createApp();
  return new Promise((resolve) => {
    const srv = app.listen(4000, () => resolve(srv));
  });
}

async function stopAppForTests(srv) {
  await pool.end();
  return new Promise((resolve) => srv.close(resolve));
}

module.exports = { createApp, startAppForTests, stopAppForTests };
