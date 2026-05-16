const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/cvController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();
router.use(authenticate);
router.use(authorize('SERVIDOR', 'JTH', 'ADMIN'));

// ─── Reglas de validación reutilizables (OBS #1) ───────────────────────────
const personalRules = [
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
];

const educationRules = [
  body('level').isIn(['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL']).withMessage('Nivel inválido'),
  body('institution').trim().notEmpty().withMessage('Institución requerida'),
  body('title').trim().notEmpty().withMessage('Título requerido'),
];

const workRules = [
  body('experienceType').isIn(['PUBLICA', 'PRIVADA', 'DOCENTE']).withMessage('Tipo inválido'),
  body('employer').trim().notEmpty().withMessage('Empleador requerido'),
  body('position').trim().notEmpty().withMessage('Cargo requerido'),
  body('startDate').isDate().withMessage('Fecha inicio inválida'),
];

const managementRules = [
  body('hierarchicalLevel').trim().notEmpty().withMessage('Nivel jerárquico requerido'),
  body('positionName').trim().notEmpty().withMessage('Nombre del cargo requerido'),
  body('entityName').trim().notEmpty().withMessage('Entidad requerida'),
  body('startDate').isDate().withMessage('Fecha de inicio inválida'),
];

// ─── Rutas (la documentación OpenAPI vive en src/docs/openapi/cv.docs.js) ──

router.get('/summary',     ctrl.getSummary);
router.get('/export/pdf',  ctrl.exportPdf);

// HU-006 / HU-007
router.get('/personal',    ctrl.getPersonal);
router.put('/personal',    personalRules, ctrl.savePersonal);

// HU-008
router.get('/education',         ctrl.listEducation);
router.post('/education',        educationRules, ctrl.createEducation);
router.put('/education/:id',     educationRules, ctrl.updateEducation);
router.delete('/education/:id',  ctrl.deleteEducation);

// HU-009
router.get('/work',         ctrl.listWork);
router.post('/work',        workRules, ctrl.createWork);
router.put('/work/:id',     workRules, ctrl.updateWork);
router.delete('/work/:id',  ctrl.deleteWork);

// HU-010
router.get('/management',   ctrl.getManagement);
router.put('/management',   managementRules, ctrl.saveManagement);

// HU-014
router.get('/attachments/:section/:id?', ctrl.getAttachment);

// OBS #2 — Validación JTH
router.put('/validate',
  authorize('JTH', 'ADMIN'),
  [
    body('userId').isString().notEmpty().withMessage('userId requerido'),
    body('section').isIn(['personal', 'education', 'work', 'management']).withMessage('Sección inválida'),
    body('recordId').optional().isInt({ min: 1 }).withMessage('recordId debe ser entero ≥ 1'),
    body('validated').isBoolean().withMessage('validated debe ser true o false'),
  ],
  ctrl.setValidation
);

module.exports = router;