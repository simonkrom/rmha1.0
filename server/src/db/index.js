const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONNECTION = process.env.DATABASE_URL || 'postgres://lab_user:lab_pass@localhost:5432/laboratoire';

const pool = new Pool({ connectionString: CONNECTION });

async function runMigrations() {
  const sqlPath = path.join(__dirname, '..', 'migrations', 'create_tables.sql');
  if (!fs.existsSync(sqlPath)) return;
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
}

module.exports = { pool, runMigrations };
