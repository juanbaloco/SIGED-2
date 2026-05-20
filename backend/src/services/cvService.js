const fs   = require('fs');
const path = require('path');
const { getDb } = require('../config/database');
const logger = require('../config/logger');

const UPLOAD_ROOT = path.resolve(process.env.CV_UPLOAD_DIR || './database/uploads/cv');
const MAX_FILE_BYTES = 2 * 1024 * 1024;

// Tipos permitidos para soportes de sección (PDF / JPG)
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg'];

// Tipos permitidos para foto de perfil (JPG + PNG)
const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

const EXT_BY_MIME = {
  'application/pdf': '.pdf',
  'image/jpeg':      '.jpg',
  'image/jpg':       '.jpg',
  'image/png':       '.png',
};

const MIME_BY_EXT = {
  '.pdf':  'application/pdf',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
};

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// HU-013: persistir archivo base64 → disco. Devuelve { path, name }.
const saveAttachment = ({ userId, section, base64, filename, mime, allowedMime }) => {
  if (!base64) return { path: null, name: null };

  const validMimes = allowedMime || ALLOWED_MIME;
  if (!validMimes.includes(mime))
    throw { status: 400, message: 'Formato no permitido.' };

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_FILE_BYTES)
    throw { status: 400, message: 'El archivo supera el tamaño máximo de 2 MB.' };

  const userDir = path.join(UPLOAD_ROOT, userId, section);
  ensureDir(userDir);

  const ext       = EXT_BY_MIME[mime] || '.bin';
  const safeName  = (filename || `doc${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalName = `${Date.now()}_${safeName}`;
  const finalPath = path.join(userDir, finalName);
  fs.writeFileSync(finalPath, buffer);

  return {
    path: path.relative(path.resolve('.'), finalPath).replace(/\\/g, '/'),
    name: filename || finalName,
  };
};

const removeFileIfExists = (relPath) => {
  if (!relPath) return;
  const abs = path.resolve(relPath);
  if (fs.existsSync(abs)) {
    try { fs.unlinkSync(abs); } catch (e) { logger.warn('Could not unlink file', { abs, err: e.message }); }
  }
};

const inferMimeType = (fileNameOrPath) => {
  const ext = path.extname(fileNameOrPath || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
};

// ─── HU-006 / HU-007: datos personales ───────────────────────────────────────
const getPersonalData = (userId) =>
  getDb().prepare(`SELECT * FROM cv_personal_data WHERE user_id = ?`).get(userId) || null;

const upsertPersonalData = (userId, payload) => {
  const db = getDb();
  const existing = getPersonalData(userId);

  if (existing && existing.validated)
    throw { status: 423, message: 'La sección está validada. Solicite al JTH levantar la validación para modificar.' };

  const required = ['firstName', 'lastName', 'documentTypeId', 'documentNumber', 'birthDate',
                    'gender', 'mobile', 'email', 'country', 'department', 'city', 'zoneType'];
  for (const f of required)
    if (payload[f] === undefined || payload[f] === null || payload[f] === '')
      throw { status: 400, message: `Campo obligatorio: ${f}` };

  if (!['URBANA', 'RURAL'].includes(payload.zoneType))
    throw { status: 400, message: 'zoneType debe ser URBANA o RURAL' };

  // HU-007
  if (payload.zoneType === 'RURAL' && !payload.addressComplement)
    throw { status: 400, message: 'En zona rural, el complemento o dirección especial es obligatorio' };
  if (payload.zoneType === 'URBANA' && !payload.address)
    throw { status: 400, message: 'En zona urbana, la dirección es obligatoria' };

  // ── Soporte de sección (PDF / JPG) ──────────────────────────────────────
  let attachmentPath = existing?.attachment_path || null;
  let attachmentName = existing?.attachment_name || null;
  if (payload.fileBase64) {
    removeFileIfExists(existing?.attachment_path);
    const att = saveAttachment({
      userId, section: 'personal',
      base64: payload.fileBase64, filename: payload.fileName, mime: payload.fileMime,
      allowedMime: ALLOWED_MIME,
    });
    attachmentPath = att.path;
    attachmentName = att.name;
  }

  // ── Foto de perfil (JPG / PNG) ───────────────────────────────────────────
  let photoPath = existing?.photo_path || null;
  let photoName = existing?.photo_name || null;
  if (payload.photoBase64) {
    removeFileIfExists(existing?.photo_path);
    const photoAtt = saveAttachment({
      userId, section: 'photo',
      base64: payload.photoBase64, filename: payload.photoName, mime: payload.photoMime,
      allowedMime: ALLOWED_PHOTO_MIME,
    });
    photoPath = photoAtt.path;
    photoName = photoAtt.name;
  }

  if (existing) {
    db.prepare(`
      UPDATE cv_personal_data SET
        first_name = ?, middle_name = ?, last_name = ?, second_last_name = ?,
        document_type_id = ?, document_number = ?, birth_date = ?, gender = ?,
        phone = ?, mobile = ?, email = ?,
        country = ?, department = ?, city = ?, zone_type = ?, address = ?, address_complement = ?,
        attachment_path = ?, attachment_name = ?,
        photo_path = ?, photo_name = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      payload.firstName, payload.middleName || null, payload.lastName, payload.secondLastName || null,
      payload.documentTypeId, payload.documentNumber, payload.birthDate, payload.gender,
      payload.phone || null, payload.mobile, payload.email,
      payload.country, payload.department, payload.city, payload.zoneType,
      payload.address || null, payload.addressComplement || null,
      attachmentPath, attachmentName,
      photoPath, photoName,
      userId,
    );
  } else {
    db.prepare(`
      INSERT INTO cv_personal_data (
        user_id, first_name, middle_name, last_name, second_last_name,
        document_type_id, document_number, birth_date, gender,
        phone, mobile, email, country, department, city,
        zone_type, address, address_complement,
        attachment_path, attachment_name,
        photo_path, photo_name
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      userId,
      payload.firstName, payload.middleName || null, payload.lastName, payload.secondLastName || null,
      payload.documentTypeId, payload.documentNumber, payload.birthDate, payload.gender,
      payload.phone || null, payload.mobile, payload.email,
      payload.country, payload.department, payload.city,
      payload.zoneType, payload.address || null, payload.addressComplement || null,
      attachmentPath, attachmentName,
      photoPath, photoName,
    );
  }

  return getPersonalData(userId);
};

// ─── HU-008: formación académica ─────────────────────────────────────────────
const listEducation = (userId) =>
  getDb().prepare(`SELECT * FROM cv_education WHERE user_id = ? ORDER BY end_date DESC, id DESC`).all(userId);

const createEducation = (userId, payload) => {
  const db = getDb();
  const required = ['level', 'institution', 'title'];
  for (const f of required)
    if (!payload[f]) throw { status: 400, message: `Campo obligatorio: ${f}` };
  if (!['PREGRADO', 'POSGRADO', 'TARJETA_PROFESIONAL'].includes(payload.level))
    throw { status: 400, message: 'Nivel inválido' };

  const att = saveAttachment({
    userId, section: 'education',
    base64: payload.fileBase64, filename: payload.fileName, mime: payload.fileMime,
  });

  db.prepare(`
    INSERT INTO cv_education (user_id, level, institution, title, start_date, end_date,
      professional_card, attachment_path, attachment_name)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(userId, payload.level, payload.institution, payload.title,
         payload.startDate || null, payload.endDate || null,
         payload.professionalCard || null, att.path, att.name);

  return listEducation(userId);
};

const updateEducation = (userId, id, payload) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM cv_education WHERE id = ? AND user_id = ?`).get(id, userId);
  if (!row) throw { status: 404, message: 'Registro no encontrado' };
  if (row.validated)
    throw { status: 423, message: 'Registro validado. Solicite al JTH levantar la validación.' };

  let attachmentPath = row.attachment_path;
  let attachmentName = row.attachment_name;
  if (payload.fileBase64) {
    removeFileIfExists(row.attachment_path);
    const att = saveAttachment({
      userId, section: 'education',
      base64: payload.fileBase64, filename: payload.fileName, mime: payload.fileMime,
    });
    attachmentPath = att.path;
    attachmentName = att.name;
  }

  db.prepare(`
    UPDATE cv_education SET
      level = ?, institution = ?, title = ?, start_date = ?, end_date = ?,
      professional_card = ?, attachment_path = ?, attachment_name = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(payload.level || row.level, payload.institution || row.institution, payload.title || row.title,
         payload.startDate ?? row.start_date, payload.endDate ?? row.end_date,
         payload.professionalCard ?? row.professional_card,
         attachmentPath, attachmentName, id, userId);

  return listEducation(userId);
};

const deleteEducation = (userId, id) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM cv_education WHERE id = ? AND user_id = ?`).get(id, userId);
  if (!row) throw { status: 404, message: 'Registro no encontrado' };
  if (row.validated) throw { status: 423, message: 'Registro validado, no se puede eliminar' };
  removeFileIfExists(row.attachment_path);
  db.prepare(`DELETE FROM cv_education WHERE id = ? AND user_id = ?`).run(id, userId);
  return listEducation(userId);
};

// ─── HU-009: experiencia laboral ─────────────────────────────────────────────
const listWork = (userId) =>
  getDb().prepare(`SELECT * FROM cv_work_experience WHERE user_id = ? ORDER BY start_date DESC, id DESC`).all(userId);

const createWork = (userId, payload) => {
  const db = getDb();
  const required = ['experienceType', 'employer', 'position', 'startDate'];
  for (const f of required)
    if (!payload[f]) throw { status: 400, message: `Campo obligatorio: ${f}` };
  if (!['PUBLICA', 'PRIVADA', 'DOCENTE'].includes(payload.experienceType))
    throw { status: 400, message: 'Tipo de experiencia inválido' };

  const att = saveAttachment({
    userId, section: 'work',
    base64: payload.fileBase64, filename: payload.fileName, mime: payload.fileMime,
  });

  db.prepare(`
    INSERT INTO cv_work_experience (user_id, experience_type, employer, position,
      start_date, end_date, is_current, responsibilities, attachment_path, attachment_name)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(userId, payload.experienceType, payload.employer, payload.position,
         payload.startDate, payload.endDate || null, payload.isCurrent ? 1 : 0,
         payload.responsibilities || null, att.path, att.name);

  return listWork(userId);
};

const updateWork = (userId, id, payload) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM cv_work_experience WHERE id = ? AND user_id = ?`).get(id, userId);
  if (!row) throw { status: 404, message: 'Registro no encontrado' };
  if (row.validated)
    throw { status: 423, message: 'Registro validado. Solicite al JTH levantar la validación.' };

  let attachmentPath = row.attachment_path;
  let attachmentName = row.attachment_name;
  if (payload.fileBase64) {
    removeFileIfExists(row.attachment_path);
    const att = saveAttachment({
      userId, section: 'work',
      base64: payload.fileBase64, filename: payload.fileName, mime: payload.fileMime,
    });
    attachmentPath = att.path;
    attachmentName = att.name;
  }

  db.prepare(`
    UPDATE cv_work_experience SET
      experience_type = ?, employer = ?, position = ?, start_date = ?, end_date = ?,
      is_current = ?, responsibilities = ?, attachment_path = ?, attachment_name = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(payload.experienceType || row.experience_type, payload.employer || row.employer,
         payload.position || row.position, payload.startDate || row.start_date,
         payload.endDate ?? row.end_date,
         payload.isCurrent !== undefined ? (payload.isCurrent ? 1 : 0) : row.is_current,
         payload.responsibilities ?? row.responsibilities,
         attachmentPath, attachmentName, id, userId);

  return listWork(userId);
};

const deleteWork = (userId, id) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM cv_work_experience WHERE id = ? AND user_id = ?`).get(id, userId);
  if (!row) throw { status: 404, message: 'Registro no encontrado' };
  if (row.validated) throw { status: 423, message: 'Registro validado, no se puede eliminar' };
  removeFileIfExists(row.attachment_path);
  db.prepare(`DELETE FROM cv_work_experience WHERE id = ? AND user_id = ?`).run(id, userId);
  return listWork(userId);
};

// ─── HU-010: gerencia pública ────────────────────────────────────────────────
const isManagementEnabled = (userId) => {
  const db = getDb();
  try {
    const roleRow = db.prepare(`
      SELECT r.code
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).get(userId);

    if (!roleRow) return false;
    const role = roleRow.code;

    if (role === 'ADMIN') return true;

    if (role === 'JTH' || role === 'SERVIDOR') {
      const exp = db.prepare(`
        SELECT 1 FROM cv_work_experience
        WHERE user_id = ?
        AND UPPER(TRIM(experience_type)) = 'PUBLICA'
        LIMIT 1
      `).get(userId);
      return !!exp;
    }

    return false;
  } catch (error) {
    console.error('Error en isManagementEnabled:', error);
    return false;
  }
};

const getManagement = (userId) =>
  getDb().prepare(`SELECT * FROM cv_management WHERE user_id = ?`).get(userId) || null;

const upsertManagement = (userId, payload) => {
  if (!isManagementEnabled(userId))
    throw { status: 403, message: 'La sección de Gerencia Pública no está habilitada para su cargo' };

  const db = getDb();
  const required = ['hierarchicalLevel', 'positionName', 'entityName', 'startDate'];
  for (const f of required)
    if (!payload[f]) throw { status: 400, message: `Campo obligatorio: ${f}` };

  const existing = getManagement(userId);
  if (existing && existing.validated)
    throw { status: 423, message: 'La sección está validada. Solicite al JTH levantar la validación.' };

  let attachmentPath = existing?.attachment_path || null;
  let attachmentName = existing?.attachment_name || null;
  if (payload.fileBase64) {
    removeFileIfExists(existing?.attachment_path);
    const att = saveAttachment({
      userId, section: 'management',
      base64: payload.fileBase64, filename: payload.fileName, mime: payload.fileMime,
    });
    attachmentPath = att.path;
    attachmentName = att.name;
  }

  if (existing) {
    db.prepare(`
      UPDATE cv_management SET
        hierarchical_level = ?, position_name = ?, entity_name = ?, start_date = ?,
        attachment_path = ?, attachment_name = ?,
        updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      payload.hierarchicalLevel, payload.positionName, payload.entityName, payload.startDate,
      attachmentPath, attachmentName, userId,
    );
  } else {
    db.prepare(`
      INSERT INTO cv_management (
        user_id, hierarchical_level, position_name, entity_name, start_date,
        attachment_path, attachment_name
      ) VALUES (?,?,?,?,?,?,?)
    `).run(
      userId, payload.hierarchicalLevel, payload.positionName, payload.entityName, payload.startDate,
      attachmentPath, attachmentName,
    );
  }
  return getManagement(userId);
};

// ─── Adjuntos ────────────────────────────────────────────────────────────────
const getAttachmentRow = (userId, section, id) => {
  const db = getDb();
  switch (section) {
    case 'personal':
      return db.prepare(`SELECT attachment_path, attachment_name FROM cv_personal_data WHERE user_id = ?`).get(userId);
    case 'management':
      return db.prepare(`SELECT attachment_path, attachment_name FROM cv_management WHERE user_id = ?`).get(userId);
    case 'education':
      if (!id) throw { status: 400, message: 'El id es requerido para adjuntos de formación' };
      return db.prepare(`SELECT attachment_path, attachment_name FROM cv_education WHERE user_id = ? AND id = ?`).get(userId, id);
    case 'work':
      if (!id) throw { status: 400, message: 'El id es requerido para adjuntos de experiencia' };
      return db.prepare(`SELECT attachment_path, attachment_name FROM cv_work_experience WHERE user_id = ? AND id = ?`).get(userId, id);
    default:
      throw { status: 400, message: 'Sección de adjunto inválida' };
  }
};

const getAttachmentFile = (userId, section, id) => {
  const row = getAttachmentRow(userId, section, id);
  if (!row || !row.attachment_path)
    throw { status: 404, message: 'No existe documento adjunto para este registro' };

  const absolutePath = path.resolve(row.attachment_path);
  if (!fs.existsSync(absolutePath))
    throw { status: 404, message: 'El archivo adjunto no fue encontrado en el servidor' };

  const fileName = row.attachment_name || path.basename(absolutePath);
  const mimeType = inferMimeType(fileName);

  return { absolutePath, fileName, mimeType };
};

// ─── FIX: Foto de perfil del usuario como archivo servible ───────────────────
// Devuelve { absolutePath, fileName, mimeType } para que el router la sirva
// igual que getAttachmentFile. Si no existe lanza 404.
const getPhotoFile = (userId) => {
  const db = getDb();

  // Buscar en cv_personal_data (fuente primaria según schema)
  const row = db.prepare(`SELECT photo_path, photo_name FROM cv_personal_data WHERE user_id = ?`).get(userId);
  const photoPath = row?.photo_path;

  if (!photoPath)
    throw { status: 404, message: 'No hay foto de perfil registrada' };

  const absolutePath = path.resolve(photoPath);
  if (!fs.existsSync(absolutePath))
    throw { status: 404, message: 'El archivo de foto no fue encontrado en el servidor' };

  const fileName = row.photo_name || path.basename(absolutePath);
  const mimeType = inferMimeType(absolutePath);

  return { absolutePath, fileName, mimeType };
};

// ─── Resumen completo ────────────────────────────────────────────────────────
const getSummary = (userId) => ({
  personal:          getPersonalData(userId),
  education:         listEducation(userId),
  work:              listWork(userId),
  management:        getManagement(userId),
  managementEnabled: isManagementEnabled(userId),
});

module.exports = {
  getPersonalData, upsertPersonalData,
  listEducation, createEducation, updateEducation, deleteEducation,
  listWork, createWork, updateWork, deleteWork,
  getManagement, upsertManagement, isManagementEnabled,
  getAttachmentFile,
  getPhotoFile,       // ← nuevo: sirve la foto de perfil al frontend
  getSummary,
};