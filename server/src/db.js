const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONNECTION = process.env.DATABASE_URL;

if (!CONNECTION) {
  console.warn('DATABASE_URL not set — database pool disabled');
}

const pool = CONNECTION ? new Pool({ connectionString: CONNECTION }) : null;

async function runMigrations() {
  if (!pool) return;
  const sqlPath = path.join(__dirname, '..', 'migrations', 'create_tables.sql');
  if (!fs.existsSync(sqlPath)) return;
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
}

module.exports = { pool, runMigrations };
