const express = require('express');
const { supabaseAdmin } = require('../supabase');

module.exports = (auth, audit, pool) => {
  const router = express.Router();

  // Create a new patient
  router.post('/patients', async (req, res) => {
    const { firstName, lastName, phone, address, city, services } = req.body || {};
    if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });

    try {
      const servicesVal = services || [];

      if (supabaseAdmin) {
        // Insert into Supabase
        const toInsert = {
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          address: address || null,
          city: city || null,
          services: servicesVal
        };
        const { data, error } = await supabaseAdmin.from('patients').insert([toInsert]).select().single();
        if (error) {
          console.error('Supabase insert error', error);
          return res.status(500).json({ error: 'internal' });
        }
        const row = data;
        const patient = {
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone,
          address: row.address,
          city: row.city,
          services: row.services || [],
          createdAt: row.created_at
        };
        try { await audit.log({ action: 'create_patient', resource: 'patient', meta: patient }); } catch (e) { console.error('audit error', e && e.message); }
        return res.json({ ok: true, patient });
      }

      // Fallback to Postgres pool
      const q = `INSERT INTO patients (first_name, last_name, phone, address, city, services) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, first_name, last_name, phone, address, city, services, created_at`;
      const values = [firstName, lastName, phone || null, address || null, city || null, servicesVal];
      const { rows } = await pool.query(q, values);
      const row = rows[0];

      // Map DB row (snake_case) to camelCase API response
      const patient = {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        address: row.address,
        city: row.city,
        services: row.services || [],
        createdAt: row.created_at
      };

      try { await audit.log({ action: 'create_patient', resource: 'patient', meta: patient }); } catch (e) { console.error('audit error', e && e.message); }

      res.json({ ok: true, patient });
    } catch (err) {
      console.error(err && (err.stack || err.message));
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get all patients
  router.get('/patients', async (req, res) => {
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from('patients').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase query error', error);
          return res.status(500).json({ error: 'internal' });
        }
        const patients = data.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone,
          address: row.address,
          city: row.city,
          services: row.services || [],
          createdAt: row.created_at
        }));
        return res.json({ ok: true, patients });
      }

      // Fallback to Postgres
      const { rows } = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
      const patients = rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        address: row.address,
        city: row.city,
        services: row.services || [],
        createdAt: row.created_at
      }));
      res.json({ ok: true, patients });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  // Get patient by ID
  router.get('/patients/:id', async (req, res) => {
    const { id } = req.params;
    try {
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from('patients').select('*').eq('id', id).single();
        if (error) {
          console.error('Supabase query error', error);
          return res.status(404).json({ error: 'not found' });
        }
        const patient = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          services: data.services || [],
          createdAt: data.created_at
        };
        return res.json({ ok: true, patient });
      }

      // Fallback to Postgres
      const { rows } = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      const row = rows[0];
      const patient = {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        address: row.address,
        city: row.city,
        services: row.services || [],
        createdAt: row.created_at
      };
      res.json({ ok: true, patient });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal' });
    }
  });

  return router;
};