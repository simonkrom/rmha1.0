const express = require('express');
const { supabaseAdmin } = require('../supabase');

module.exports = (auth, audit, pool, requireAuth, requireRole) => {
  const router = express.Router();

  // Get all orders for pharmacist (pharmacie service)
  router.get('/orders', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM patients 
        WHERE services @> '["pharmacie"]'::jsonb
        ORDER BY created_at DESC
      `);

      // Map to order format
      const orders = rows.map(row => ({
        id: row.id,
        orderId: `CMD-${row.id}`,
        patient: {
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone
        },
        services: row.services || [],
        createdAt: row.created_at
      }));

      await audit.log({ user_id: req.user.id, action: 'list_orders', resource: 'order' });
      res.json({ ok: true, orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get order details
  router.get('/orders/:orderId', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
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
        createdAt: row.created_at
      };

      await audit.log({ user_id: req.user.id, action: 'view_order', resource: 'order', meta: { orderId } });
      res.json({ ok: true, order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Mark order as prepared
  router.post('/orders/:orderId/prepare', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    const { orderId } = req.params;
    try {
      const { rows } = await pool.query(
        'UPDATE patients SET status = $1 WHERE id = $2 RETURNING *',
        ['prepared', orderId]
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
          lastName: row.last_name
        }
      };

      await audit.log({ 
        user_id: req.user.id, 
        action: 'prepare_order', 
        resource: 'order', 
        meta: { orderId, preparedBy: req.user.username }
      });

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to('manager').emit('orderPrepared', { orderId, preparedBy: req.user.username });
        io.to('admin').emit('activity', { type: 'orderPrepared', orderId });
        io.to('coursier').emit('orderPrepared', { orderId });
      }

      res.json({ ok: true, order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get medications inventory
  router.get('/medications', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    try {
      const medicationsFile = require('../../data/medications.json');
      await audit.log({ user_id: req.user.id, action: 'list_medications', resource: 'medication' });
      res.json({ ok: true, medications: medicationsFile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Search medications
  router.get('/medications/search', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    const { q } = req.query;
    try {
      if (!q) {
        return res.status(400).json({ error: 'search query required' });
      }

      const medicationsFile = require('../../data/medications.json');
      const filtered = medicationsFile.filter(med =>
        med.name.toLowerCase().includes(q.toLowerCase()) ||
        med.category.toLowerCase().includes(q.toLowerCase())
      );

      await audit.log({ user_id: req.user.id, action: 'search_medications', resource: 'medication', meta: { q } });
      res.json({ ok: true, medications: filtered });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Reorder medication
  router.post('/medications/:medId/reorder', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    const { medId } = req.params;
    const { quantity } = req.body || {};

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    try {
      const medicationsFile = require('../../data/medications.json');
      const medication = medicationsFile.find(m => m.id == medId);

      if (!medication) {
        return res.status(404).json({ error: 'Medication not found' });
      }

      const reorder = {
        id: Date.now(),
        medicationId: medId,
        medication: medication.name,
        quantity,
        orderedBy: req.user.username,
        orderedAt: new Date().toISOString(),
        status: 'pending'
      };

      await audit.log({
        user_id: req.user.id,
        action: 'reorder_medication',
        resource: 'medication',
        meta: { medicationId: medId, quantity }
      });

      // Emit socket event to manager
      const io = req.app.get('io');
      if (io) {
        io.to('manager').emit('medicationReorder', reorder);
        io.to('admin').emit('activity', { type: 'medicationReorder', reorder });
      }

      res.json({ ok: true, reorder });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get prescriptions (placeholder for ordonnances)
  router.get('/prescriptions', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    try {
      // This would come from a prescriptions table
      const { rows } = await pool.query(`
        SELECT * FROM patients 
        WHERE services @> '["pharmacie"]'::jsonb
        LIMIT 50
      `);

      const prescriptions = rows.map(row => ({
        id: row.id,
        patient: row.first_name + ' ' + row.last_name,
        date: row.created_at,
        status: 'pending'
      }));

      await audit.log({ user_id: req.user.id, action: 'list_prescriptions', resource: 'prescription' });
      res.json({ ok: true, prescriptions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Upload prescription image (placeholder)
  router.post('/prescriptions/upload', requireAuth(auth), requireRole('pharmacien'), async (req, res) => {
    try {
      // In a real application, handle file upload here
      const prescription = {
        id: Date.now(),
        uploadedBy: req.user.username,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      };

      await audit.log({
        user_id: req.user.id,
        action: 'upload_prescription',
        resource: 'prescription'
      });

      res.json({ ok: true, prescription });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  return router;
};
