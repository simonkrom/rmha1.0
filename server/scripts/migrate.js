const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'create_tables.sql'), 'utf8');
const connection = process.env.DATABASE_URL || 'postgres://lab_user:lab_pass@localhost:5432/laboratoire';

async function run() {
  const pool = new Pool({ connectionString: connection });
  try {
    console.log('Running migrations...');
    await pool.query(sql);
    console.log('Migrations applied.');
  } catch (err) {
    console.error('Migration failed:', err && (err.stack || err.message));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
