const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { sendWelcomeEmail, sendPasswordRecoveryEmail } = require('./emailService');
const logger    = require('../config/logger');

const BCRYPT_ROUNDS   = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const MAX_ATTEMPTS    = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_MINUTES    = parseInt(process.env.LOCK_TIME_MINUTES) || 15;
const JWT_SECRET      = process.env.JWT_SECRET;
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '8h';
const REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET;
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const TOKEN_EXPIRES_MINUTES = 60; // 1 hora para el token de reset

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateTempPassword = () => {
  const chars    = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '@#$%&*!';
  let pass = '';
  for (let i = 0; i < 7; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  pass += specials[Math.floor(Math.random() * specials.length)];
  return pass.split('').sort(() => Math.random() - 0.5).join('');
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const issueTokens = (user, roles) => {
  const payload      = { sub: user.id, email: user.email, roles };
  const accessToken  = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  return { accessToken, refreshToken };
};

const storeRefreshToken = (userId, refreshToken) => {
  const db       = getDb();
  const hash     = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`)
    .run(userId, hash, expiresAt);
};

const getUserWithRoles = (userId) => {
  const db   = getDb();
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!user) return null;
  const roles = db.prepare(`
    SELECT r.code FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ? AND (ur.end_date IS NULL OR ur.end_date >= date('now'))
  `).all(userId).map(r => r.code);
  return { ...user, roles };
};

const audit = (userId, action, entity, entityId, details, ip) => {
  try {
    getDb().prepare(`
      INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId || null, action, entity || null, entityId || null,
        details ? JSON.stringify(details) : null, ip || null);
  } catch (e) {
    logger.error('Audit log failed', { error: e.message });
  }
};

// ─── HU-001: Login ────────────────────────────────────────────────────────────

const login = async ({ documentTypeId, documentNumber, password, ip }) => {
  const db = getDb();

  const user = db.prepare(`
    SELECT u.* FROM users u
    WHERE u.document_type_id = ? AND u.document_number = ?
  `).get(documentTypeId, documentNumber);

  if (!user) throw { status: 401, message: 'Credenciales inválidas' };

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(user.locked_until) - Date.now()) / 60000);
    throw { status: 423, message: `Cuenta bloqueada. Intente en ${remaining} minuto(s)` };
  }

  if (!user.is_active)
    throw { status: 403, message: 'Cuenta inhabilitada. Contacte a Talento Humano' };

  if (!user.password_hash)
    throw { status: 401, message: 'Debe establecer su contraseña. Verifique el correo registrado' };

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    const attempts    = user.login_attempts + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString() : null;

    db.prepare(`UPDATE users SET login_attempts = ?, locked_until = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(attempts, lockedUntil, user.id);
    audit(null, 'LOGIN_FAILED', 'users', user.id, { attempts }, ip);

    if (lockedUntil)
      throw { status: 423, message: `Demasiados intentos. Cuenta bloqueada por ${LOCK_MINUTES} minutos` };
    throw { status: 401, message: `Credenciales inválidas. Intentos restantes: ${MAX_ATTEMPTS - attempts}` };
  }

  db.prepare(`UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?`)
    .run(user.id);

  const userWithRoles              = getUserWithRoles(user.id);
  const { accessToken, refreshToken } = issueTokens(userWithRoles, userWithRoles.roles);
  storeRefreshToken(user.id, refreshToken);

  audit(user.id, 'LOGIN_SUCCESS', 'users', user.id, null, ip);
  logger.info(`User logged in: ${user.id}`);

  return {
    accessToken,
    refreshToken,
    mustChangePassword: !!user.must_change_password,
    user: { id: user.id, email: user.email, roles: userWithRoles.roles },
  };
};

// ─── HU-002: Recuperar contraseña (doble mecanismo) ──────────────────────────

const recoverPassword = async ({ documentTypeId, documentNumber, ip }) => {
  const db = getDb();
  const MSG = 'Si los datos son correctos, recibirá un correo con instrucciones para restablecer su contraseña';

  const user = db.prepare(`
    SELECT u.*, dt.name AS doc_type_name FROM users u
    JOIN document_types dt ON u.document_type_id = dt.id
    WHERE u.document_type_id = ? AND u.document_number = ?
  `).get(documentTypeId, documentNumber);

  // Anti-enumeración: responder igual aunque no exista
  if (!user || !user.is_active) return { message: MSG };

  // Límite: máximo 3 solicitudes por día
  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM password_reset_tokens
    WHERE user_id = ? AND DATE(created_at) = DATE('now')
  `).get(user.id);
  if (todayCount.count >= 3)
    throw { status: 429, message: 'Ha superado el límite de 3 solicitudes de recuperación por día. Intente nuevamente mañana.' };

  // 1. Generar token único para el enlace
  const resetToken     = uuidv4();
  const resetTokenHash = hashToken(resetToken);
  const expiresAt      = new Date(Date.now() + TOKEN_EXPIRES_MINUTES * 60 * 1000).toISOString();

  // 2. Generar contraseña temporal (plan B)
  const tempPassword     = generateTempPassword();
  const tempPasswordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  // 3. Invalidar tokens previos no usados del usuario
  db.prepare(`UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0`)
    .run(user.id);

  // 4. Guardar token + hash de contraseña temporal en BD
  db.prepare(`
    INSERT INTO password_reset_tokens (user_id, token, token_hash, temp_password_hash, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, resetToken, resetTokenHash, tempPasswordHash, expiresAt);

  // 5. Actualizar contraseña temporal en el usuario
  db.prepare(`UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = datetime('now') WHERE id = ?`)
    .run(tempPasswordHash, user.id);

  // 6. Enviar correo con ambos mecanismos
  await sendPasswordRecoveryEmail({
    email:        user.email,
    tempPassword,
    resetToken,
    documentType: user.doc_type_name,
    documentNumber,
  });

  audit(user.id, 'PASSWORD_RECOVERY', 'users', user.id, null, ip);
  return { message: MSG };
};

// ─── Reset por token (enlace del correo) ──────────────────────────────────────

const resetPasswordByToken = async ({ token, newPassword, ip }) => {
  const db = getDb();

  // Validar formato contraseña
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&*!¡¿?.,-])[a-zA-Z\d@#$%&*!¡¿?.,-]{6,}$/;
  if (!passwordRegex.test(newPassword))
    throw { status: 400, message: 'La contraseña debe tener mínimo 6 caracteres, letras, números y al menos un carácter especial' };

  const tokenHash = hashToken(token);

  const record = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')
  `).get(tokenHash);

  if (!record) throw { status: 400, message: 'El enlace de recuperación es inválido o ha expirado. Solicite uno nuevo.' };

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(record.user_id);
  if (!user || !user.is_active) throw { status: 403, message: 'Usuario no encontrado o inactivo' };

  // Verificar que no sea igual a la contraseña temporal ya existente
  if (user.password_hash) {
    const same = await bcrypt.compare(newPassword, user.password_hash);
    if (same) throw { status: 400, message: 'La nueva contraseña no puede ser igual a la temporal' };
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Actualizar contraseña y marcar token como usado (transacción)
  const doReset = db.transaction(() => {
    db.prepare(`UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?`)
      .run(newHash, record.user_id);
    db.prepare(`UPDATE password_reset_tokens SET used = 1 WHERE id = ?`)
      .run(record.id);
    // Invalidar también otros tokens pendientes del mismo usuario
    db.prepare(`UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0`)
      .run(record.user_id);
    // Revocar refresh tokens activos
    db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`)
      .run(record.user_id);
  });

  doReset();

  audit(record.user_id, 'PASSWORD_RESET_BY_TOKEN', 'users', record.user_id, null, ip);
  logger.info(`Password reset via token for user: ${record.user_id}`);

  return { message: 'Contraseña actualizada correctamente. Ya puede iniciar sesión.' };
};

// ─── HU-003: Cambiar contraseña (autenticado) ────────────────────────────────

const changePassword = async ({ userId, currentPassword, newPassword, ip }) => {
  const db = getDb();

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&*!¡¿?.,-])[a-zA-Z\d@#$%&*!¡¿?.,-]{6,}$/;
  if (!passwordRegex.test(newPassword))
    throw { status: 400, message: 'La contraseña debe tener mínimo 6 caracteres, incluir letras, números y al menos un carácter especial' };

  if (user.password_hash && currentPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw { status: 401, message: 'Contraseña actual incorrecta' };
  }

  if (user.password_hash) {
    const same = await bcrypt.compare(newPassword, user.password_hash);
    if (same) throw { status: 400, message: 'La nueva contraseña no puede ser igual a la actual' };
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.prepare(`UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?`)
    .run(newHash, userId);
  db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`).run(userId);

  audit(userId, 'PASSWORD_CHANGED', 'users', userId, null, ip);
  return { message: 'Contraseña actualizada correctamente' };
};

// ─── HU-004: Crear usuario (JTH) ─────────────────────────────────────────────

const createUser = async ({ documentTypeId, documentNumber, email, roleCode = 'SERVIDOR', createdBy, ip }) => {
  const db = getDb();

  const exists = db.prepare(`
    SELECT id FROM users WHERE (document_type_id = ? AND document_number = ?) OR email = ?
  `).get(documentTypeId, documentNumber, email);
  if (exists) throw { status: 409, message: 'Ya existe un usuario con ese documento o correo electrónico' };

  const docType = db.prepare(`SELECT * FROM document_types WHERE id = ?`).get(documentTypeId);
  if (!docType) throw { status: 400, message: 'Tipo de documento inválido' };

  const role = db.prepare(`SELECT * FROM roles WHERE code = ?`).get(roleCode);
  if (!role) throw { status: 400, message: 'Rol inválido' };

  const userId       = uuidv4();
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, document_type_id, document_number, email, password_hash, must_change_password)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(userId, documentTypeId, documentNumber, email, passwordHash);
    db.prepare(`INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)`)
      .run(userId, role.id, createdBy);
  })();

  try {
    await sendWelcomeEmail({ email, documentType: docType.name, documentNumber, tempPassword });
    db.prepare(`UPDATE users SET welcome_email_sent = 1, updated_at = datetime('now') WHERE id = ?`).run(userId);
  } catch (err) {
    logger.error('Failed to send welcome email', { error: err.message, email });
  }

  audit(createdBy, 'USER_CREATED', 'users', userId, { email, roleCode }, ip);
  logger.info(`New user created: ${userId} by ${createdBy}`);
  return { id: userId, email, documentType: docType.name, documentNumber, role: roleCode };
};

// ─── HU-005: Inhabilitar rol (JTH) ───────────────────────────────────────────

const disableUserRole = async ({ targetUserId, roleCode, endDate, disabledBy, ip }) => {
  const db = getDb();

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetUserId);
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };

  const role = db.prepare(`SELECT * FROM roles WHERE code = ?`).get(roleCode);
  if (!role) throw { status: 400, message: 'Rol inválido' };

  const activeRole = db.prepare(`
    SELECT id FROM user_roles
    WHERE user_id = ? AND role_id = ? AND (end_date IS NULL OR end_date >= date('now'))
  `).get(targetUserId, role.id);
  if (!activeRole) throw { status: 404, message: 'El usuario no tiene ese rol activo' };

  db.prepare(`UPDATE user_roles SET end_date = ? WHERE id = ?`).run(endDate, activeRole.id);

  const remaining = db.prepare(`
    SELECT COUNT(*) as count FROM user_roles
    WHERE user_id = ? AND (end_date IS NULL OR end_date >= date('now'))
  `).get(targetUserId);

  if (remaining.count === 0) {
    db.prepare(`UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(targetUserId);
    db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`).run(targetUserId);
  }

  audit(disabledBy, 'ROLE_DISABLED', 'user_roles', String(activeRole.id), { targetUserId, roleCode, endDate }, ip);
  return { message: `Rol ${roleCode} inhabilitado correctamente a partir del ${endDate}` };
};

// ─── Refresh token ────────────────────────────────────────────────────────────

const refreshAccessToken = (refreshToken) => {
  const db = getDb();
  let payload;
  try { payload = jwt.verify(refreshToken, REFRESH_SECRET); }
  catch { throw { status: 401, message: 'Refresh token inválido o expirado' }; }

  const hash   = hashToken(refreshToken);
  const stored = db.prepare(`
    SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime('now')
  `).get(hash);
  if (!stored) throw { status: 401, message: 'Refresh token revocado o expirado' };

  const userWithRoles = getUserWithRoles(payload.sub);
  if (!userWithRoles || !userWithRoles.is_active) throw { status: 401, message: 'Usuario inactivo' };

  const newAccessToken = jwt.sign(
    { sub: userWithRoles.id, email: userWithRoles.email, roles: userWithRoles.roles },
    JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
  );
  return { accessToken: newAccessToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = (refreshToken, userId) => {
  const db = getDb();
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?`).run(hash);
  }
  audit(userId, 'LOGOUT', 'users', userId, null, null);
};

module.exports = {
  login,
  recoverPassword,
  resetPasswordByToken,
  changePassword,
  createUser,
  disableUserRole,
  refreshAccessToken,
  logout,
  getUserWithRoles,
};