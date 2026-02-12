const express = require('express');
const { supabaseAdmin } = require('../supabase');

module.exports = (auth, audit, pool, requireAuth, requireRole) => {
  const router = express.Router();

  // GET /api/admin/users - List all users
  router.get('/users', requireAuth(auth), requireRole('admin'), async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
      await audit.log({ user_id: req.user.id, action: 'list_users', resource: 'user' });
      res.json({ ok: true, users: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // POST /api/admin/users - Create new user
  router.post('/users', requireAuth(auth), requireRole('admin'), async (req, res) => {
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password, and role required' });
    }
    try {
      // Register user via auth service
      const user = await auth.register(username, password, role);
      
      // Log audit
      await audit.log({ 
        user_id: req.user.id, 
        action: 'create_user', 
        resource: 'user', 
        meta: { username, role } 
      });
      
      res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      if (err.message === 'USER_EXISTS') {
        return res.status(409).json({ error: 'User already exists' });
      }
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // PUT /api/admin/users/:userId - Update user
  router.put('/users/:userId', requireAuth(auth), requireRole('admin'), async (req, res) => {
    const { userId } = req.params;
    const { username, password, role } = req.body || {};
    
    if (!username && !password && !role) {
      return res.status(400).json({ error: 'At least one field required' });
    }

    try {
      // Get current user data
      const { rows: currentUser } = await pool.query(
        'SELECT id, username, role FROM users WHERE id = $1',
        [userId]
      );
      
      if (!currentUser || !currentUser.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      let newUsername = username || currentUser[0].username;
      let newRole = role || currentUser[0].role;
      
      // Prevent changing the last admin
      if (currentUser[0].role === 'admin' && newRole !== 'admin') {
        const { rows: adminCount } = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        if (adminCount[0].count <= 1) {
          return res.status(400).json({ error: 'Cannot remove the last admin' });
        }
      }

      // Update username and role
      await pool.query(
        'UPDATE users SET username = $1, role = $2 WHERE id = $3',
        [newUsername, newRole, userId]
      );

      // Update password if provided
      if (password) {
        const hashedPassword = await auth.hashPassword(password);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [hashedPassword, userId]
        );
      }

      // Log audit
      await audit.log({
        user_id: req.user.id,
        action: 'update_user',
        resource: 'user',
        meta: { 
          userId,
          username: newUsername,
          role: newRole,
          passwordChanged: !!password
        }
      });

      res.json({ ok: true, user: { id: userId, username: newUsername, role: newRole } });
    } catch (err) {
      if (err.message === 'DUPLICATE_USERNAME') {
        return res.status(409).json({ error: 'Username already exists' });
      }
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // DELETE /api/admin/users/:userId - Delete user
  router.delete('/users/:userId', requireAuth(auth), requireRole('admin'), async (req, res) => {
    const { userId } = req.params;
    
    // Prevent deleting self or admin user (if only one admin)
    try {
      const { rows: userToDelete } = await pool.query(
        'SELECT id, username, role FROM users WHERE id = $1',
        [userId]
      );
      
      if (!userToDelete || !userToDelete.length) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (userToDelete[0].id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Prevent deleting the last admin
      if (userToDelete[0].role === 'admin') {
        const { rows: adminCount } = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        if (adminCount[0].count <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last admin' });
        }
      }

      const deletedUsername = userToDelete[0].username;

      // Delete user
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      // Log audit
      await audit.log({
        user_id: req.user.id,
        action: 'delete_user',
        resource: 'user',
        meta: { userId, username: deletedUsername }
      });

      res.json({ ok: true, message: 'User deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // POST /api/admin/seed-admin - Seed initial admin (if no admin exists)
  router.post('/seed-admin', async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
      if (rows && rows.length) return res.status(400).json({ error: 'admin exists' });
      const { username = 'admin', password = 'admin123', email = 'admin@example.com' } = req.body || {};
      const user = await auth.register(username, password, 'admin');
      
      // Optional: create in Supabase Auth
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

  // GET /api/admin/activity - Get activity from audit logs
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
