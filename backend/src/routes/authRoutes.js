const { Router } = require('express');
const { body, query } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// ── Públicas ──────────────────────────────────────────────────────────────────

router.get('/document-types', ctrl.getDocumentTypes);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Iniciar sesión (HU-001)
 *     description: Autentica al servidor público con tipo y número de documento.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentTypeId
 *               - documentNumber
 *               - password
 *             properties:
 *               documentTypeId:
 *                 type: integer
 *                 example: 1
 *               documentNumber:
 *                 type: string
 *                 example: "00000000"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Admin@2024!"
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve tokens y datos del usuario.
 *       401:
 *         description: Credenciales inválidas.
 *         content:
 *          application/json:
 *            schema:
 *             $ref: '#/components/schemas/ErrorResponse'      
 *       423:
 *         description: Cuenta bloqueada por demasiados intentos.
 *         content:
 *          application/json:
 *            schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *            example:
 *              success: false
 *              message: "Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intente nuevamente en 15 minutos."
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *          application/json:
 *            schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *            example:
 *             success: false
 *             message: "Error interno del servidor"
 */


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