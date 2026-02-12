const express = require('express');
const { supabaseAdmin } = require('../supabase');

module.exports = (auth, audit, pool, requireAuth, requireRole) => {
  const router = express.Router();

  // Get all orders for manager
  router.get('/orders', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM patients ORDER BY created_at DESC'
      );

      const orders = rows.map(row => ({
        id: row.id,
        orderId: `CMD-${row.id}`,
        patient: {
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone
        },
        services: row.services || [],
        createdAt: row.created_at,
        status: row.status || 'pending'
      }));

      await audit.log({ user_id: req.user.id, action: 'list_orders', resource: 'order' });
      res.json({ ok: true, orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get order details
  router.get('/orders/:orderId', requireAuth(auth), requireRole('manager'), async (req, res) => {
    const { orderId } = req.params;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM patients WHERE id = $1',
        [orderId]
      );

      if (!rows || !rows.length) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const row = rows[0];
      const order = {
        id: row.id,
        orderId: `CMD-${row.id}`,
        patient: {
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone,
          address: row.address,
          city: row.city
        },
        services: row.services || [],
        createdAt: row.created_at,
        status: row.status || 'pending'
      };

      await audit.log({ user_id: req.user.id, action: 'view_order', resource: 'order', meta: { orderId } });
      res.json({ ok: true, order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Create new order
  router.post('/orders', requireAuth(auth), requireRole('manager'), async (req, res) => {
    const { firstName, lastName, phone, address, city, services } = req.body || {};
    if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });

    try {
      const servicesVal = services || [];
      const q = `INSERT INTO patients (first_name, last_name, phone, address, city, services, status) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
      const values = [firstName, lastName, phone || null, address || null, city || null, servicesVal, 'pending'];
      const { rows } = await pool.query(q, values);
      const row = rows[0];

      const order = {
        id: row.id,
        orderId: `CMD-${row.id}`,
        patient: {
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone
        },
        services: row.services || [],
        createdAt: row.created_at,
        status: row.status
      };

      await audit.log({ 
        user_id: req.user.id, 
        action: 'create_order', 
        resource: 'order', 
        meta: order 
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to('manager').emit('newOrder', order);
        io.to('admin').emit('activity', { type: 'newOrder', order });
        io.to('pharmacien').emit('newOrder', order);
        io.to('coursier').emit('newOrder', order);
      }

      res.json({ ok: true, order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Update order status
  router.put('/orders/:orderId', requireAuth(auth), requireRole('manager'), async (req, res) => {
    const { orderId } = req.params;
    const { status, courier } = req.body || {};

    try {
      const q = 'UPDATE patients SET status = $1 WHERE id = $2 RETURNING *';
      const { rows } = await pool.query(q, [status || 'pending', orderId]);

      if (!rows || !rows.length) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const row = rows[0];
      const order = {
        id: row.id,
        orderId: `CMD-${row.id}`,
        status: row.status
      };

      await audit.log({ 
        user_id: req.user.id, 
        action: 'update_order_status', 
        resource: 'order', 
        meta: { orderId, status, courier }
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to('manager').emit('orderUpdated', { orderId, status });
        io.to('admin').emit('activity', { type: 'orderUpdated', orderId, status });
        if (courier) io.to('coursier').emit('orderAssigned', { orderId, courier });
      }

      res.json({ ok: true, order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get all couriers
  router.get('/couriers', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT id, username, role FROM users WHERE role = 'coursier' ORDER BY username"
      );

      const couriers = rows.map(row => ({
        id: row.id,
        name: row.username,
        status: 'online',
        deliveries: 0,
        rating: 4.5
      }));

      await audit.log({ user_id: req.user.id, action: 'list_couriers', resource: 'courier' });
      res.json({ ok: true, couriers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Update courier position (real-time tracking)
  router.post('/couriers/:courierId/position', requireAuth(auth), requireRole('manager', 'coursier'), async (req, res) => {
    const { courierId } = req.params;
    const { lat, lng, timestamp } = req.body || {};

    try {
      const position = {
        courierId,
        lat,
        lng,
        timestamp: timestamp || new Date().toISOString()
      };

      await audit.log({ 
        user_id: req.user.id, 
        action: 'courier_position', 
        resource: 'courier',
        meta: position
      });

      // Emit socket event for real-time tracking
      const io = req.app.get('io');
      if (io) {
        io.to('manager').emit('courierPosition', position);
        io.to('admin').emit('courierPosition', position);
      }

      res.json({ ok: true, position });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get all patients
  router.get('/patients', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT DISTINCT first_name, last_name, phone, city, services, created_at FROM patients ORDER BY created_at DESC'
      );

      const patients = rows.map((row, idx) => ({
        id: idx + 1,
        name: `${row.first_name} ${row.last_name}`,
        phone: row.phone,
        city: row.city,
        services: row.services || [],
        lastOrder: row.created_at
      }));

      await audit.log({ user_id: req.user.id, action: 'list_patients', resource: 'patient' });
      res.json({ ok: true, patients });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get alerts/activity
  router.get('/alerts', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM audit WHERE action IN ('newOrder', 'orderPrepared', 'orderValidated') ORDER BY created_at DESC LIMIT 20"
      );

      const alerts = rows.map(row => ({
        id: row.id,
        type: row.action === 'newOrder' ? 'info' : 'success',
        title: row.action === 'newOrder' ? 'Nouvelle commande' : 'Commande confirmée',
        message: JSON.stringify(row.meta || {}),
        time: row.created_at,
        read: false
      }));

      await audit.log({ user_id: req.user.id, action: 'list_alerts', resource: 'audit' });
      res.json({ ok: true, alerts });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Generate report
  router.get('/reports/daily', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM patients 
        WHERE DATE(created_at) = CURRENT_DATE
      `);

      const stats = rows[0] || {};

      await audit.log({ user_id: req.user.id, action: 'generate_report', resource: 'report', meta: { type: 'daily' } });

      res.json({ 
        ok: true, 
        report: {
          type: 'daily',
          date: new Date().toISOString().split('T')[0],
          stats
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  router.get('/reports/monthly', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM patients 
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `);

      const stats = rows[0] || {};

      await audit.log({ user_id: req.user.id, action: 'generate_report', resource: 'report', meta: { type: 'monthly' } });

      res.json({ 
        ok: true, 
        report: {
          type: 'monthly',
          month: new Date().toISOString().slice(0, 7),
          stats
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get dashboard stats
  router.get('/dashboard/stats', requireAuth(auth), requireRole('manager'), async (req, res) => {
    try {
      const [ordersResult, couriersResult, patientsResult] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM patients'),
        pool.query("SELECT COUNT(*) FROM users WHERE role = 'coursier'"),
        pool.query('SELECT COUNT(DISTINCT first_name, last_name) FROM patients')
      ]);

      const stats = {
        totalOrders: parseInt(ordersResult.rows[0].count) || 0,
        totalCouriers: parseInt(couriersResult.rows[0].count) || 0,
        totalPatients: parseInt(patientsResult.rows[0].count) || 0,
        ordersToday: 0,
        deliveriesCompleted: 0
      };

      await audit.log({ user_id: req.user.id, action: 'view_stats', resource: 'dashboard' });
      res.json({ ok: true, stats });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  return router;
};
