const { Router } = require('express');
const { body, query } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// ─── Reglas de validación reutilizables ────────────────────────────────────
const passwordRules = body('newPassword')
  .notEmpty().withMessage('La nueva contraseña es requerida')
  .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
  .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&*!¡¿?.,-])/)
  .withMessage('Debe incluir letras, números y al menos un carácter especial');

const loginRules = [
  body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
  body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido').isLength({ max: 20 }),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

const recoverRules = [
  body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
  body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido'),
];

const createUserRules = [
  body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
  body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido').isLength({ max: 20 }),
  body('email').isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
  body('roleCode').optional().isIn(['SERVIDOR', 'JTH']).withMessage('Rol inválido'),
];

// ─── Rutas (documentación OpenAPI en src/docs/openapi/auth.docs.js) ────────

// Públicas
router.get('/document-types',           ctrl.getDocumentTypes);
router.post('/login',                   loginRules, ctrl.login);
router.post('/recover-password',        recoverRules, ctrl.recoverPassword);
router.get('/verify-reset-token',       [query('token').notEmpty().withMessage('Token requerido')], ctrl.verifyResetToken);
router.post('/reset-password',          [body('token').notEmpty().withMessage('Token requerido'), passwordRules], ctrl.resetPassword);
router.post('/refresh',                 ctrl.refresh);

// Autenticadas
router.use(authenticate);

router.get('/me',                       ctrl.me);
router.post('/logout',                  ctrl.logout);
router.put('/change-password',          [passwordRules], ctrl.changePassword);

// JTH / Admin
router.post('/users',
  authorize('JTH', 'ADMIN'),
  createUserRules,
  ctrl.createUser
);

router.put('/users/:userId/roles/:roleCode/disable',
  authorize('JTH', 'ADMIN'),
  [body('endDate').isDate().withMessage('Fecha de fin inválida (YYYY-MM-DD)')],
  ctrl.disableRole
);

module.exports = router;