const { validationResult } = require('express-validator');
const cvService = require('../services/cvService');
const { generateCvPdf } = require('../services/cvExportService');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    return false;
  }
  return true;
};

const userId = (req) => req.user.sub;

// GET /api/cv/summary
exports.getSummary = (req, res, next) => {
  try {
    const summary = cvService.getSummary(userId(req));
    const enabled = cvService.isManagementEnabled(userId(req));
    res.json({
      success: true,
      data: {...summary, managementEnabled: !!enabled },
    });
    } catch (err) {
    next(err);
  }
};

// HU-006 / HU-007 — Datos personales
exports.getPersonal = (req, res, next) => {
  try { res.json({ success: true, data: cvService.getPersonalData(userId(req)) });
 }
  catch (err) { next(err); }
};
exports.savePersonal = (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try { res.json({ success: true, data: cvService.upsertPersonalData(userId(req), req.body) }); }
  catch (err) { next(err); }
};

// HU-008 — Formación académica
exports.listEducation = (req, res, next) => {
  try { res.json({ success: true, data: cvService.listEducation(userId(req)) }); }
  catch (err) { next(err); }
};
exports.createEducation = (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try { res.status(201).json({ success: true, data: cvService.createEducation(userId(req), req.body) }); }
  catch (err) { next(err); }
};
exports.updateEducation = (req, res, next) => {
  try { res.json({ success: true, data: cvService.updateEducation(userId(req), parseInt(req.params.id), req.body) }); }
  catch (err) { next(err); }
};
exports.deleteEducation = (req, res, next) => {
  try { res.json({ success: true, data: cvService.deleteEducation(userId(req), parseInt(req.params.id)) }); }
  catch (err) { next(err); }
};

// HU-009 — Experiencia laboral
exports.listWork = (req, res, next) => {
  try { res.json({ success: true, data: cvService.listWork(userId(req)) }); }
  catch (err) { next(err); }
};
exports.createWork = (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try { res.status(201).json({ success: true, data: cvService.createWork(userId(req), req.body) }); }
  catch (err) { next(err); }
};
exports.updateWork = (req, res, next) => {
  try { res.json({ success: true, data: cvService.updateWork(userId(req), parseInt(req.params.id), req.body) }); }
  catch (err) { next(err); }
};
exports.deleteWork = (req, res, next) => {
  try { res.json({ success: true, data: cvService.deleteWork(userId(req), parseInt(req.params.id)) }); }
  catch (err) { next(err); }
};

// HU-010 — Gerencia Pública
exports.getManagement = async (req, res, next) => {
  try {
    const enabled = await cvService.isManagementEnabled(userId(req));
    if (!enabled) {
      return res.status(403).json({ success:false,
        message: 'Sección de Gerencia Pública no habilitada para su cargo.' 
      });
    }

    const management = await cvService.getManagement(userId(req));
    return res.json({ success: true, data: management || {} });
  } catch (err) {
    next(err);
  }
};
exports.saveManagement = async (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try {
    const enabled = await cvService.isManagementEnabled(userId(req));
    if (!enabled) {
      return res.status(403).json({
         success: false,
         message: 'No autorizado para guardar Gerencia Pública.' });
    }

    const payload = {
      hierarchicalLevel: req.body.hierarchicalLevel,
      positionName: req.body.positionName,
      entityName: req.body.entityName,
      startDate: req.body.startDate,
      attachment: req.body.attachment,
    };

    const management = await cvService.upsertManagement(userId(req), payload);
    return res.json({ success: true, data: management });
  } catch (err) {
    next(err);
  }
};

// HU-014 — Previsualización de adjuntos
exports.getAttachment = (req, res, next) => {
  try {
    const section = req.params.section;
    const parsedId = req.params.id ? parseInt(req.params.id, 10) : undefined;
    if (req.params.id && Number.isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: 'El id del adjunto es inválido' });
    }

    const file = cvService.getAttachmentFile(userId(req), section, parsedId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    return res.sendFile(file.absolutePath);
  } catch (err) { next(err); }
};

// HU-015 — Descargar e imprimir hoja de vida
exports.exportPdf = async (req, res, next) => {
  try {
    const pdfBuffer = await generateCvPdf(userId(req));
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="hoja_vida_${date}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) { next(err); }
};
