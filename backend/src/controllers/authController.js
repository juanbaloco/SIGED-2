const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { getDb } = require('../config/database');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const getIp = (req) => req.ip || req.connection?.remoteAddress;

// POST /api/auth/login  — HU-001
exports.login = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.login({ ...req.body, ip: getIp(req) });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// POST /api/auth/recover-password  — HU-002
exports.recoverPassword = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.recoverPassword({ ...req.body, ip: getIp(req) });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password  — Enlace del correo
exports.resetPassword = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.resetPasswordByToken({
      token: req.body.token,
      newPassword: req.body.newPassword,
      ip: getIp(req),
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password  — HU-003
exports.changePassword = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.changePassword({
      userId: req.user.sub, ...req.body, ip: getIp(req),
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// POST /api/auth/users  — HU-004 (JTH)
exports.createUser = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.createUser({
      ...req.body, createdBy: req.user.sub, ip: getIp(req),
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

// PUT /api/auth/users/:userId/roles/:roleCode/disable  — HU-005 (JTH)
exports.disableRole = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.disableUserRole({
      targetUserId: req.params.userId,
      roleCode: req.params.roleCode,
      endDate: req.body.endDate,
      disabledBy: req.user.sub,
      ip: getIp(req),
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
exports.refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'refreshToken requerido' });
    const result = authService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  const { refreshToken } = req.body;
  authService.logout(refreshToken, req.user?.sub);
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
};

// GET /api/auth/document-types
exports.getDocumentTypes = (req, res) => {
  const db    = getDb();
  const types = db.prepare(`SELECT id, code, name FROM document_types ORDER BY name`).all();
  res.json({ success: true, data: types });
};

// GET /api/auth/me
exports.me = (req, res) => {
  const user = authService.getUserWithRoles(req.user.sub);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  const { password_hash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
};

// GET /api/auth/verify-reset-token?token=XYZ  — valida si el token es aún válido
exports.verifyResetToken = (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Token requerido' });

  const crypto    = require('crypto');
  const db        = getDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = db.prepare(`
    SELECT id, expires_at FROM password_reset_tokens
    WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')
  `).get(tokenHash);

  if (!record) return res.status(400).json({ success: false, message: 'El enlace es inválido o ha expirado' });
  res.json({ success: true, message: 'Token válido', expiresAt: record.expires_at });
};