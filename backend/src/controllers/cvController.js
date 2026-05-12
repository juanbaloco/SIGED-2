const { validationResult } = require('express-validator');
const cvService = require('../services/cvService');

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
  try { res.json({ success: true, data: cvService.getSummary(userId(req)) }); }
  catch (err) { next(err); }
};

// HU-006 / HU-007 — Datos personales
exports.getPersonal = (req, res, next) => {
  try { res.json({ success: true, data: cvService.getPersonalData(userId(req)) }); }
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
exports.getManagement = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: cvService.getManagement(userId(req)),
      enabled: cvService.isManagementEnabled(userId(req)),
    });
  } catch (err) { next(err); }
};
exports.saveManagement = (req, res, next) => {
  if (!handleValidation(req, res)) return;
  try { res.json({ success: true, data: cvService.upsertManagement(userId(req), req.body) }); }
  catch (err) { next(err); }
};
