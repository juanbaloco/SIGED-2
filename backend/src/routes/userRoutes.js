const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { getDb } = require('../config/database');

const router = Router();
router.use(authenticate);

// ── Helper: obtener roles activos de un usuario ───────────────────────────
const getActiveRoles = (userId) => {
  const db = getDb();
  return db.prepare(`
    SELECT r.code, r.name, ur.start_date, ur.end_date
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND (ur.end_date IS NULL OR ur.end_date >= date('now'))
    ORDER BY ur.start_date DESC
  `).all(userId);
};

// ── Helper: obtener historial completo de roles ───────────────────────────
const getAllRoles = (userId) => {
  const db = getDb();
  return db.prepare(`
    SELECT r.code, r.name, ur.start_date, ur.end_date,
           ur.id AS user_role_id,
           CASE WHEN ur.end_date IS NULL OR ur.end_date >= date('now') THEN 1 ELSE 0 END AS is_active
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
    ORDER BY ur.start_date DESC
  `).all(userId);
};

// ─────────────────────────────────────────────────────────────────────────
// GET /api/users
// Lista todos los usuarios (paginado). Solo JTH / ADMIN.
// Query params: page (default 1), limit (default 20), search (texto libre),
//               role (filtra por código de rol), active (true/false)
// ─────────────────────────────────────────────────────────────────────────
router.get('/', authorize('JTH', 'ADMIN'), (req, res) => {
  const db = getDb();
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const search = req.query.search?.trim() || '';
  const role   = req.query.role?.toUpperCase() || '';
  const active = req.query.active; // 'true' | 'false' | undefined

  let where  = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ` AND (u.document_number LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (active === 'true')  { where += ` AND u.is_active = 1`; }
  if (active === 'false') { where += ` AND u.is_active = 0`; }

  if (role) {
    where += `
      AND EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r2 ON ur2.role_id = r2.id
        WHERE ur2.user_id = u.id AND r2.code = ?
          AND (ur2.end_date IS NULL OR ur2.end_date >= date('now'))
      )`;
    params.push(role);
  }

  const total = db.prepare(`
    SELECT COUNT(*) AS count FROM users u ${where}
  `).get(...params).count;

  const users = db.prepare(`
    SELECT u.id, u.email, u.document_number, u.is_active,
           u.must_change_password, u.login_attempts, u.locked_until,
           u.created_at, u.updated_at,
           dt.code AS doc_type_code, dt.name AS doc_type_name
    FROM users u
    JOIN document_types dt ON u.document_type_id = dt.id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  // Añadir roles activos a cada usuario
  const result = users.map(u => ({
    ...u,
    roles: getActiveRoles(u.id).map(r => r.code),
  }));

  res.json({
    success: true,
    data: result,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/users/search?documentTypeId=1&documentNumber=123
// Búsqueda puntual por documento. Usado por el formulario HU-005.
// ─────────────────────────────────────────────────────────────────────────
router.get('/search', authorize('JTH', 'ADMIN'), (req, res) => {
  const { documentTypeId, documentNumber } = req.query;

  if (!documentTypeId || !documentNumber) {
    return res.status(400).json({ success: false, message: 'documentTypeId y documentNumber son requeridos' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.email, u.document_number, u.is_active,
           u.must_change_password, u.created_at,
           dt.code AS doc_type_code, dt.name AS doc_type_name
    FROM users u
    JOIN document_types dt ON u.document_type_id = dt.id
    WHERE u.document_type_id = ? AND u.document_number = ?
  `).get(documentTypeId, documentNumber);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  const roles = getActiveRoles(user.id).map(r => r.code);

  res.json({ success: true, data: { ...user, roles } });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/users/:id
// Detalle completo de un usuario (incluye historial de roles). JTH / ADMIN.
// ─────────────────────────────────────────────────────────────────────────
router.get('/:id', authorize('JTH', 'ADMIN'), (req, res) => {
  const db = getDb();

  const user = db.prepare(`
    SELECT u.id, u.email, u.document_number, u.is_active,
           u.must_change_password, u.login_attempts, u.locked_until,
           u.created_at, u.updated_at,
           dt.code AS doc_type_code, dt.name AS doc_type_name
    FROM users u
    JOIN document_types dt ON u.document_type_id = dt.id
    WHERE u.id = ?
  `).get(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  const rolesHistory = getAllRoles(user.id);

  res.json({
    success: true,
    data: {
      ...user,
      roles: rolesHistory.filter(r => r.is_active).map(r => r.code),
      rolesHistory,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/users/:id/audit
// Historial de auditoría de un usuario. Solo ADMIN.
// ─────────────────────────────────────────────────────────────────────────
router.get('/:id/audit', authorize('ADMIN'), (req, res) => {
  const db = getDb();
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = (page - 1) * limit;

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  const total = db.prepare(
    `SELECT COUNT(*) AS count FROM audit_log WHERE user_id = ?`
  ).get(req.params.id).count;

  const logs = db.prepare(`
    SELECT id, action, entity, entity_id, details, ip_address, created_at
    FROM audit_log
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.params.id, limit, offset);

  res.json({
    success: true,
    data: logs.map(l => ({ ...l, details: l.details ? JSON.parse(l.details) : null })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id/gerencia-publica
// Habilita/deshabilita la sección de Gerencia Pública (HU-010). JTH / ADMIN.
// Body: { enabled: boolean }
// ─────────────────────────────────────────────────────────────────────────
router.patch('/:id/gerencia-publica', authorize('JTH', 'ADMIN'), (req, res) => {
  const db = getDb();
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean')
    return res.status(400).json({ success: false, message: 'enabled (boolean) requerido' });

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  db.prepare(`UPDATE users SET gerencia_publica_enabled = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(enabled ? 1 : 0, req.params.id);
  db.prepare(`
    INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip_address)
    VALUES (?, 'GERENCIA_PUBLICA_TOGGLED', 'users', ?, ?, ?)
  `).run(req.user.sub, req.params.id, JSON.stringify({ enabled }), req.ip);

  res.json({ success: true, message: `Gerencia Pública ${enabled ? 'habilitada' : 'deshabilitada'}` });
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/users/:id/unlock
// Desbloquea manualmente una cuenta bloqueada por intentos fallidos. JTH / ADMIN.
// ─────────────────────────────────────────────────────────────────────────
router.patch('/:id/unlock', authorize('JTH', 'ADMIN'), (req, res) => {
  const db = getDb();

  const user = db.prepare(`SELECT id, locked_until FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  db.prepare(`
    UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);

  // Registrar en auditoría
  db.prepare(`
    INSERT INTO audit_log (user_id, action, entity, entity_id, ip_address)
    VALUES (?, 'ACCOUNT_UNLOCKED', 'users', ?, ?)
  `).run(req.user.sub, req.params.id, req.ip);

  res.json({ success: true, message: 'Cuenta desbloqueada correctamente' });
});

module.exports = router;