const express = require('express');
const { supabaseAdmin } = require('../supabase');

module.exports = (auth, audit, pool, requireAuth, requireRole) => {
  const router = express.Router();

  router.get('/users', requireAuth(auth), requireRole('admin'), async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, username, role, created_at FROM users');
      await audit.log({ user_id: req.user.id, action: 'list_users', resource: 'user' });
      res.json({ ok: true, users: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  router.post('/seed-admin', async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
      if (rows && rows.length) return res.status(400).json({ error: 'admin exists' });
      const { username = 'admin', password = 'admin123', email = 'admin@example.com' } = req.body || {};
      const user = await auth.register(username, password, 'admin');
      
      // Optionnel : créer l'admin dans Supabase Auth
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { username, role: 'admin' }
          });
        } catch (supabaseErr) {
          console.error('Supabase admin creation error:', supabaseErr.message);
        }
      }
      
      await audit.log({ user_id: user.id, action: 'create_admin', resource: 'user', meta: { username } });
      res.json({ ok: true, user: { id: user.id, username: user.username } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get activity from audit logs via Supabase
  router.get('/activity', requireAuth(auth), requireRole('admin'), async (req, res) => {
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from('audit').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return res.json({ ok: true, activity: data });
      }

      // Fallback to Postgres
      const { rows } = await pool.query('SELECT * FROM audit ORDER BY created_at DESC LIMIT 100');
      res.json({ ok: true, activity: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  return router;
};
