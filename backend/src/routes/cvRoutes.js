const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/cvController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);
router.use(authorize('SERVIDOR', 'JTH', 'ADMIN'));

router.get('/summary', ctrl.getSummary);
router.get('/export/pdf', ctrl.exportPdf);

// ── HU-006 / HU-007: Datos personales ─────────────────────────────────────
/**
 * @openapi
 * /cv/personal:
 *   get:
 *     tags:
 *       - Hoja de Vida — Datos Personales
 *     summary: Obtener mis datos personales (HU-006)
 *     description: |
 *       Devuelve los datos personales del servidor público autenticado.
 *       Si aún no ha registrado información, el campo `data` será `null`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operación exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PersonalInfo'
 *       401:
 *         description: No autenticado o token expirado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Token de acceso requerido"
 *       403:
 *         description: Sin permisos suficientes (rol no autorizado).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No tiene permisos para realizar esta acción"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/personal', ctrl.getPersonal);
router.put('/personal',
  [
    body('firstName').trim().notEmpty().withMessage('Nombre requerido'),
    body('lastName').trim().notEmpty().withMessage('Apellido requerido'),
    body('documentTypeId').isInt({ min: 1 }).withMessage('Tipo de documento inválido'),
    body('documentNumber').trim().notEmpty().withMessage('Número de documento requerido'),
    body('birthDate').isDate().withMessage('Fecha de nacimiento inválida (YYYY-MM-DD)'),
    body('gender').isIn(['M', 'F', 'O']).withMessage('Género inválido'),
    body('mobile').trim().notEmpty().withMessage('Celular requerido'),
    body('email').isEmail().withMessage('Correo inválido'),
    body('country').trim().notEmpty().withMessage('País requerido'),
    body('department').trim().notEmpty().withMessage('Departamento requerido'),
    body('city').trim().notEmpty().withMessage('Ciudad requerida'),
    body('zoneType').isIn(['URBANA', 'RURAL']).withMessage('Tipo de zona inválido'),
  ],
  ctrl.savePersonal
);

// ── HU-008: Formación académica ───────────────────────────────────────────
router.get('/education', ctrl.listEducation);
router.post('/education',
  [
    body('level').isIn(['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL']).withMessage('Nivel inválido'),
    body('institution').trim().notEmpty().withMessage('Institución requerida'),
    body('title').trim().notEmpty().withMessage('Título requerido'),
  ],
  ctrl.createEducation
);
router.put('/education/:id', ctrl.updateEducation);
router.delete('/education/:id', ctrl.deleteEducation);

// ── HU-009: Experiencia laboral ───────────────────────────────────────────
router.get('/work', ctrl.listWork);
router.post('/work',
  [
    body('experienceType').isIn(['PUBLICA', 'PRIVADA', 'DOCENTE']).withMessage('Tipo inválido'),
    body('employer').trim().notEmpty().withMessage('Empleador requerido'),
    body('position').trim().notEmpty().withMessage('Cargo requerido'),
    body('startDate').isDate().withMessage('Fecha inicio inválida'),
  ],
  ctrl.createWork
);
router.put('/work/:id', ctrl.updateWork);
router.delete('/work/:id', ctrl.deleteWork);

// ── HU-010: Gerencia Pública ──────────────────────────────────────────────
router.get('/management', ctrl.getManagement);
router.put('/management',
  [
    body('hierarchicalLevel').trim().notEmpty().withMessage('Nivel jerárquico requerido'),
    body('positionName').trim().notEmpty().withMessage('Nombre del cargo requerido'),
    body('entityName').trim().notEmpty().withMessage('Entidad requerida'),
    body('startDate').isDate().withMessage('Fecha de inicio inválida'),
  ],
  ctrl.saveManagement
);

// ── HU-014: Previsualización de adjuntos ──────────────────────────────────
router.get('/attachments/:section/:id?', ctrl.getAttachment);

module.exports = router;
