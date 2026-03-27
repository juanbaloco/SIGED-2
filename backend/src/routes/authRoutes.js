const { Router } = require('express');
const { body, query } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// ── Públicas ──────────────────────────────────────────────────────────────────

router.get('/document-types', ctrl.getDocumentTypes);

router.post('/login',
  [
    body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
    body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido').isLength({ max: 20 }),
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

// Validar si el token del enlace sigue siendo válido (GET — lo llama ResetPasswordPage al cargar)
router.get('/verify-reset-token',
  [query('token').notEmpty().withMessage('Token requerido')],
  ctrl.verifyResetToken
);

// Restablecer contraseña mediante token del correo
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token requerido'),
    body('newPassword')
      .notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&*!¡¿?.,-])/)
      .withMessage('Debe incluir letras, números y al menos un carácter especial'),
  ],
  ctrl.resetPassword
);

router.post('/refresh', ctrl.refresh);

// ── Autenticadas ──────────────────────────────────────────────────────────────

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
    body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido').isLength({ max: 20 }),
    body('email').isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
    body('roleCode').optional().isIn(['SERVIDOR', 'JTH']).withMessage('Rol inválido'),
  ],
  ctrl.createUser
);

router.put('/users/:userId/roles/:roleCode/disable',
  authorize('JTH', 'ADMIN'),
  [
    body('endDate').isDate().withMessage('Fecha de fin inválida (YYYY-MM-DD)'),
  ],
  ctrl.disableRole
);

module.exports = router;