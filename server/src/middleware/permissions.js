function requireAuth(createAuth) {
  return function (req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = header.slice(7);
    const payload = createAuth.verifyToken ? createAuth.verifyToken(token) : null;
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    req.user = { id: payload.sub, role: payload.role };
    next();
  };
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const role = req.user && req.user.role;
    if (!role || !allowedRoles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
