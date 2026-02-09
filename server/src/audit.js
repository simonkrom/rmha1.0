function createAudit(pool) {
  async function log({ user_id = null, action, resource = null, meta = null }) {
    const metaVal = meta ? JSON.stringify(meta) : null;
    try {
      await pool.query(
        'INSERT INTO audit (user_id, action, resource, meta) VALUES ($1, $2, $3, $4)',
        [user_id, action, resource, metaVal]
      );
    } catch (err) {
      console.error('Failed to write audit entry', err && err.message);
    }
  }

  return { log };
}

module.exports = { createAudit };
