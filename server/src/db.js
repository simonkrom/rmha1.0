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
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function initDb(dbPath) {
  const resolved = path.resolve(dbPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(resolved);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT,
      meta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS audit_no_update
    BEFORE UPDATE ON audit
    BEGIN
      SELECT RAISE(ABORT, 'audit table is immutable');
    END;

    CREATE TRIGGER IF NOT EXISTS audit_no_delete
    BEFORE DELETE ON audit
    BEGIN
      SELECT RAISE(ABORT, 'audit table is immutable');
    END;
  `);

  return db;
}

module.exports = { initDb };
