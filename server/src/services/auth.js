const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

function createAuth(pool, jwtSecret) {
  // In-memory storage for users when no database is available (local dev fallback)
  let localUsers = [];
  let localUserId = 1;

  async function register(username, password, role = 'user') {
    if (pool) {
      const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (rows && rows.length) throw new Error('USER_EXISTS');
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const res = await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
        [username, hash, role]
      );
      return res.rows[0];
    } else {
      // Fallback: in-memory storage
      if (localUsers.some(u => u.username === username)) throw new Error('USER_EXISTS');
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = { id: localUserId++, username, password_hash: hash, role, created_at: new Date() };
      localUsers.push(user);
      return { id: user.id, username: user.username, role: user.role };
    }
  }

  async function login(username, password) {
    if (pool) {
      const { rows } = await pool.query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [username]);
      const user = rows && rows[0];
      if (!user) throw new Error('INVALID_CREDENTIALS');
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' });
      return { token, user: { id: user.id, username: user.username, role: user.role } };
    } else {
      // Fallback: in-memory lookup
      const user = localUsers.find(u => u.username === username);
      if (!user) throw new Error('INVALID_CREDENTIALS');
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' });
      return { token, user: { id: user.id, username: user.username, role: user.role } };
    }
  }

  function verifyToken(token) {
    try {
      return jwt.verify(token, jwtSecret);
    } catch (err) {
      return null;
    }
  }

  async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  return { register, login, verifyToken, hashPassword };
}

module.exports = { createAuth };
