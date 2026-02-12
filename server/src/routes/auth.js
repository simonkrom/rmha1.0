const express = require('express');
const { supabaseAdmin } = require('../supabase');

module.exports = (auth, audit, pool, requireAuth) => {
  const router = express.Router();

  router.get('/health', (req, res) => res.json({ ok: true }));

  router.post('/register', async (req, res) => {
    const { username, password, role, email } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    try {
      const user = await auth.register(username, password, role);
      
      // Optional: add user to Supabase Auth
      if (email && supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { username, role }
          });
        } catch (supabaseErr) {
          console.error('Supabase auth error:', supabaseErr.message);
        }
      }
      
      try { await audit.log({ user_id: user.id, action: 'register', resource: 'user', meta: { username } }); } catch (e) { console.error('audit error', e && e.message); }
      res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      if (err.message === 'USER_EXISTS') return res.status(409).json({ error: 'User exists' });
      if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    try {
      const { token, user } = await auth.login(username, password);
      try { await audit.log({ user_id: user.id, action: 'login', resource: 'auth', meta: { username } }); } catch (e) { console.error('audit error', e && e.message); }
      res.json({ ok: true, token, user });
    } catch (err) {
      if (err.message === 'INVALID_CREDENTIALS') return res.status(401).json({ error: 'Invalid credentials' });
      if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  router.get('/profile', requireAuth(auth), async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const { rows } = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [req.user.id]);
      const userRow = rows && rows[0];
      try { await audit.log({ user_id: req.user.id, action: 'read_profile', resource: 'user', meta: { id: req.user.id } }); } catch (e) { console.error('audit error', e && e.message); }
      res.json({ ok: true, user: userRow });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  return router;
};

