const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// ── Pública ─────────────────────────────────────────────────────────────────

router.get('/document-types', ctrl.getDocumentTypes);

router.post('/login',
  [
    body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
    body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido')
      .isLength({ max: 20 }).withMessage('Número de documento muy largo'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  ctrl.login
);

router.post('/recover-password',
  [
    body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
    body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido'),
  ],
  ctrl.recoverPassword
);

router.post('/refresh', ctrl.refresh);

// ── Autenticadas ─────────────────────────────────────────────────────────────

router.use(authenticate);

router.get('/me', ctrl.me);

router.post('/logout', ctrl.logout);

router.put('/change-password',
  [
    body('newPassword')
      .notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&*!¡¿?.,-])/)
      .withMessage('Debe incluir letras, números y al menos un carácter especial'),
  ],
  ctrl.changePassword
);

// ── JTH / Admin ───────────────────────────────────────────────────────────────

router.post('/users',
  authorize('JTH', 'ADMIN'),
  [
    body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
    body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido')
      .isLength({ max: 20 }),
    body('email').isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
    body('roleCode').optional().isIn(['SERVIDOR', 'JTH']).withMessage('Rol inválido'),
  ],
  ctrl.createUser
);

router.put('/users/:userId/roles/:roleCode/disable',
  authorize('JTH', 'ADMIN'),
  [
    param('userId').notEmpty().withMessage('userId requerido'),
    param('roleCode').isIn(['SERVIDOR', 'JTH', 'ADMIN']).withMessage('Rol inválido'),
    body('endDate').isDate().withMessage('Fecha de fin inválida (YYYY-MM-DD)'),
  ],
  ctrl.disableRole
);

module.exports = router;