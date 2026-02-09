const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

function createAuth(pool, jwtSecret) {
  async function register(username, password, role = 'user') {
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (rows && rows.length) throw new Error('USER_EXISTS');
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const res = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hash, role]
    );
    return res.rows[0];
  }

  async function login(username, password) {
    const { rows } = await pool.query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [username]);
    const user = rows && rows[0];
    if (!user) throw new Error('INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');
    const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' });
    return { token, user: { id: user.id, username: user.username, role: user.role } };
  }

  function verifyToken(token) {
    try {
      return jwt.verify(token, jwtSecret);
    } catch (err) {
      return null;
    }
  }

  return { register, login, verifyToken };
}

module.exports = { createAuth };
