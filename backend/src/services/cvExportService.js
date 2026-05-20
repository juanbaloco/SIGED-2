const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');
const cvService = require('./cvService');

// ─── Utilidades ───────────────────────────────────────────────────────────────
const safe = (v) => (v === undefined || v === null || v === '' ? 'No registra' : String(v));

const formatDate = (value) => {
  if (!value) return 'No registra';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
};

// ─── Colores institucionales ──────────────────────────────────────────────────
const COLOR = {
  navy:       '#003366',
  navyLight:  '#0A4080',
  accent:     '#C8A951',
  accentMid:  '#E6C96A',
  lightBg:    '#F4F7FB',
  white:      '#FFFFFF',
  textDark:   '#1A1A2E',
  textMid:    '#3D4A5C',
  textLight:  '#6B7A8D',
  border:     '#D0D9E8',
  positive:   '#1B7F4F',
  separator:  '#C8A951',
};

const PAGE_W = 595.28;  // A4 points
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Paginación segura ────────────────────────────────────────────────────────
const ensureSpace = (doc, needed = 40) => {
  if (doc.y + needed > PAGE_H - MARGIN - 20) {
    doc.addPage();
    return true;
  }
  return false;
};

// ─── Línea decorativa ─────────────────────────────────────────────────────────
const drawRule = (doc, y, colorHex = COLOR.border, thickness = 0.5) => {
  doc.save()
    .strokeColor(colorHex)
    .lineWidth(thickness)
    .moveTo(MARGIN, y)
    .lineTo(PAGE_W - MARGIN, y)
    .stroke()
    .restore();
};

// ─── Encabezado de página (todas las páginas > 1) ─────────────────────────────
const addRunningHeader = (doc, fullName) => {
  doc.on('pageAdded', () => {
    doc.save();
    doc.rect(0, 0, PAGE_W, 28).fill(COLOR.navy);
    doc.font('Helvetica-Bold').fontSize(8)
       .fillColor(COLOR.white)
       .text('HOJA DE VIDA — SIGED-2', MARGIN, 10, { width: CONTENT_W / 2 });
    doc.font('Helvetica').fontSize(8)
       .fillColor(COLOR.accentMid)
       .text(fullName.toUpperCase(), MARGIN + CONTENT_W / 2, 10, { width: CONTENT_W / 2, align: 'right' });
    doc.restore();
    doc.y = 44;
  });
};

// ─── Portada / cabecera principal ─────────────────────────────────────────────
const renderCoverHeader = (doc, personal, docTypeName, photoBuffer, photoMime) => {
  const HEADER_H = 130;

  // Fondo degradado simulado con rectángulos
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(COLOR.navy);
  doc.rect(0, HEADER_H - 6, PAGE_W, 6).fill(COLOR.accent);

  // Franja decorativa lateral izquierda
  doc.rect(0, 0, 5, HEADER_H).fill(COLOR.accent);

  // ── Foto de perfil ────────────────────────────────────────────────────────
  const PHOTO_SIZE = 90;
  const PHOTO_X = PAGE_W - MARGIN - PHOTO_SIZE;
  const PHOTO_Y = (HEADER_H - PHOTO_SIZE) / 2;

  // FIX: recibir Buffer directamente (en vez de base64) para evitar
  // problemas de codificación con PDFKit al manejar imágenes PNG/JPEG.
  if (photoBuffer && photoMime && photoMime.startsWith('image/')) {
    try {
      // Marco dorado alrededor de la foto
      doc.save()
         .rect(PHOTO_X - 3, PHOTO_Y - 3, PHOTO_SIZE + 6, PHOTO_SIZE + 6)
         .fillColor(COLOR.accent)
         .fill();
      doc.image(photoBuffer, PHOTO_X, PHOTO_Y, {
        width:  PHOTO_SIZE,
        height: PHOTO_SIZE,
        fit:    [PHOTO_SIZE, PHOTO_SIZE],
        align:  'center',
        valign: 'center',
      });
    } catch (err) {
      // Si PDFKit no puede renderizar la imagen, se omite silenciosamente
      console.warn('[cvExportService] No se pudo insertar la foto en el PDF:', err.message);
    }
  }

  // ── Nombre y datos clave ──────────────────────────────────────────────────
  const firstName  = safe(personal?.first_name);
  const middleName = personal?.middle_name ? ` ${personal.middle_name}` : '';
  const lastName   = `${safe(personal?.last_name)}${personal?.second_last_name ? ` ${personal.second_last_name}` : ''}`;
  const fullName   = `${firstName}${middleName} ${lastName}`.trim();

  doc.font('Helvetica-Bold').fontSize(20)
     .fillColor(COLOR.white)
     .text(fullName, MARGIN + 12, 22, { width: CONTENT_W - PHOTO_SIZE - 20 });

  const subtitleY = doc.y + 2;
  const docNum    = personal?.document_number ? `${docTypeName || 'Doc.'}: ${personal.document_number}` : '';
  const cityInfo  = personal?.city ? `${personal.city}${personal.department ? `, ${personal.department}` : ''}` : '';

  doc.font('Helvetica').fontSize(10)
     .fillColor(COLOR.accentMid)
     .text([docNum, cityInfo].filter(Boolean).join('  ·  '), MARGIN + 12, subtitleY, {
       width: CONTENT_W - PHOTO_SIZE - 20,
     });

  const contactY = doc.y + 4;
  const contact  = [personal?.email, personal?.mobile].filter(Boolean).join('   |   ');
  doc.font('Helvetica').fontSize(9)
     .fillColor('#B0C4DE')
     .text(contact, MARGIN + 12, contactY, { width: CONTENT_W - PHOTO_SIZE - 20 });

  doc.y = HEADER_H + 14;
};

// ─── Título de sección ────────────────────────────────────────────────────────
const addSectionTitle = (doc, number, title) => {
  ensureSpace(doc, 56);
  doc.moveDown(0.6);

  const sy = doc.y;

  doc.rect(MARGIN, sy, 26, 22).fill(COLOR.navy);
  doc.rect(MARGIN + 26, sy, CONTENT_W - 26, 22).fill(COLOR.lightBg);

  doc.font('Helvetica-Bold').fontSize(10.5)
     .fillColor(COLOR.white)
     .text(String(number), MARGIN + 4, sy + 6, { width: 20, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(10.5)
     .fillColor(COLOR.navy)
     .text(title.toUpperCase(), MARGIN + 32, sy + 6, { width: CONTENT_W - 36 });

  doc.y = sy + 28;
  drawRule(doc, doc.y, COLOR.accent, 1.2);
  doc.y += 8;
};

// ─── Campo etiqueta + valor en línea ──────────────────────────────────────────
const addField = (doc, label, value, opts = {}) => {
  ensureSpace(doc, 22);
  const textY = doc.y;

  doc.font('Helvetica-Bold').fontSize(9)
     .fillColor(COLOR.textLight)
     .text(`${label.toUpperCase()}`, MARGIN, textY, { continued: true, width: 180 });

  doc.font('Helvetica').fontSize(9.5)
     .fillColor(COLOR.textDark)
     .text(`  ${safe(value)}`, { continued: false });

  if (opts.ruled) {
    drawRule(doc, doc.y + 1, COLOR.border, 0.3);
    doc.y += 4;
  }
};

// ─── Dos campos en columnas ───────────────────────────────────────────────────
const addFieldRow = (doc, pairs) => {
  ensureSpace(doc, 22);
  const rowY = doc.y;
  const colW = CONTENT_W / pairs.length;

  pairs.forEach(([label, value], i) => {
    const x = MARGIN + i * colW;
    doc.font('Helvetica-Bold').fontSize(8.5)
       .fillColor(COLOR.textLight)
       .text(label.toUpperCase(), x, rowY, { width: colW - 8 });
    doc.font('Helvetica').fontSize(9.5)
       .fillColor(COLOR.textDark)
       .text(safe(value), x, rowY + 11, { width: colW - 8 });
  });

  doc.y = rowY + 28;
  drawRule(doc, doc.y, COLOR.border, 0.3);
  doc.y += 5;
};

// ─── Tarjeta de registro (educación / experiencia) ────────────────────────────
const addCard = (doc, fields) => {
  ensureSpace(doc, fields.length * 18 + 24);

  const cardY = doc.y;
  const cardH = fields.length * 18 + 14;

  doc.rect(MARGIN, cardY, CONTENT_W, cardH).fill(COLOR.lightBg);
  doc.rect(MARGIN, cardY, 3, cardH).fill(COLOR.accent);

  let fy = cardY + 8;
  fields.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(8.5)
       .fillColor(COLOR.textLight)
       .text(label.toUpperCase(), MARGIN + 10, fy, { continued: true, width: 170 });
    doc.font('Helvetica').fontSize(9.5)
       .fillColor(COLOR.textDark)
       .text(`  ${safe(value)}`);
    fy += 18;
  });

  doc.y = cardY + cardH + 8;
};

// ─── Sección 1: Datos personales ──────────────────────────────────────────────
const renderPersonalSection = (doc, personal, docTypeName) => {
  addSectionTitle(doc, 1, 'Datos Personales');

  if (!personal) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLOR.textLight)
       .text('No hay información registrada en esta sección.');
    return;
  }

  addFieldRow(doc, [
    ['Primer nombre', personal.first_name],
    ['Segundo nombre', personal.middle_name || '—'],
  ]);
  addFieldRow(doc, [
    ['Primer apellido', personal.last_name],
    ['Segundo apellido', personal.second_last_name || '—'],
  ]);
  addFieldRow(doc, [
    ['Tipo de documento', docTypeName || personal.document_type_id],
    ['Número de documento', personal.document_number],
  ]);
  addFieldRow(doc, [
    ['Fecha de nacimiento', formatDate(personal.birth_date)],
    ['Género', personal.gender === 'M' ? 'Masculino' : personal.gender === 'F' ? 'Femenino' : 'Otro'],
  ]);
  addFieldRow(doc, [
    ['Teléfono fijo', personal.phone || '—'],
    ['Celular', personal.mobile],
  ]);
  addField(doc, 'Correo electrónico', personal.email, { ruled: true });
  addFieldRow(doc, [
    ['País', personal.country],
    ['Departamento', personal.department],
  ]);
  addFieldRow(doc, [
    ['Ciudad / Municipio', personal.city],
    ['Dirección', personal.address],
  ]);
  if (personal.address_complement) {
    addField(doc, 'Complemento', personal.address_complement, { ruled: true });
  }
};

// ─── Sección 2: Formación académica ──────────────────────────────────────────
const renderEducationSection = (doc, list) => {
  addSectionTitle(doc, 2, 'Formación Académica');

  if (!list || list.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLOR.textLight)
       .text('No hay información registrada en esta sección.');
    return;
  }

  list.forEach((item, index) => {
    ensureSpace(doc, 100);
    doc.font('Helvetica-Bold').fontSize(9.5)
       .fillColor(COLOR.navy)
       .text(`Registro ${index + 1}`, MARGIN, doc.y);
    doc.moveDown(0.2);
    addCard(doc, [
      ['Nivel de formación', item.level],
      ['Institución', item.institution],
      ['Título obtenido', item.title],
      ['Fecha de inicio', formatDate(item.start_date)],
      ['Fecha de fin / grado', formatDate(item.end_date)],
      ...(item.professional_card ? [['N.° tarjeta profesional', item.professional_card]] : []),
    ]);
  });
};

// ─── Sección 3: Experiencia laboral ──────────────────────────────────────────
const renderWorkSection = (doc, list) => {
  addSectionTitle(doc, 3, 'Experiencia Laboral');

  if (!list || list.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLOR.textLight)
       .text('No hay información registrada en esta sección.');
    return;
  }

  list.forEach((item, index) => {
    ensureSpace(doc, 120);
    doc.font('Helvetica-Bold').fontSize(9.5)
       .fillColor(COLOR.navy)
       .text(`Registro ${index + 1}`, MARGIN, doc.y);
    doc.moveDown(0.2);

    const fields = [
      ['Tipo de experiencia', item.experience_type],
      ['Entidad / Empleador', item.employer],
      ['Cargo desempeñado', item.position],
      ['Fecha de inicio', formatDate(item.start_date)],
      ['Fecha de fin', item.is_current ? 'Hasta la fecha (cargo actual)' : formatDate(item.end_date)],
    ];
    if (item.responsibilities) {
      fields.push(['Responsabilidades', item.responsibilities]);
    }
    addCard(doc, fields);
  });
};

// ─── Sección 4: Gerencia Pública ──────────────────────────────────────────────
const renderManagementSection = (doc, management, enabled) => {
  if (!enabled) return;

  addSectionTitle(doc, 4, 'Gerencia Pública');

  if (!management) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLOR.textLight)
       .text('No hay información registrada en esta sección.');
    return;
  }

  addCard(doc, [
    ['Nivel jerárquico', management.hierarchical_level],
    ['Nombre del cargo', management.position_name],
    ['Entidad', management.entity_name],
    ['Fecha de posesión', formatDate(management.start_date)],
  ]);
};

// ─── Pie de página numérico ───────────────────────────────────────────────────
const addPageNumbers = (doc) => {
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const pageNum = i + 1;

    if (i === 0) continue;

    doc.save();
    doc.rect(0, PAGE_H - 22, PAGE_W, 22).fill(COLOR.navy);
    doc.font('Helvetica').fontSize(8)
       .fillColor('#8899BB')
       .text(
         `Página ${pageNum} de ${totalPages}   —   Documento generado por SIGED-2`,
         MARGIN, PAGE_H - 15,
         { width: CONTENT_W, align: 'center' },
       );
    doc.restore();
  }
};

// ─── Mapa de tipos de documento ───────────────────────────────────────────────
const getDocTypeMap = () => {
  try {
    const rows = getDb().prepare('SELECT id, name FROM document_types').all();
    return rows.reduce((acc, row) => { acc[row.id] = row.name; return acc; }, {});
  } catch (_) {
    return {};
  }
};

// ─── FIX: Obtener foto de perfil como Buffer desde disco ─────────────────────
// Lee directamente desde cv_personal_data.photo_path.
// Retorna { buffer: Buffer, mime: string } o null si no existe / hay error.
const getUserPhoto = (userId) => {
  try {
    const db = getDb();

    // Fuente primaria: cv_personal_data (donde cvService guarda la foto)
    const row = db.prepare(
      `SELECT photo_path FROM cv_personal_data WHERE user_id = ?`
    ).get(userId);

    const photoPath = row?.photo_path;
    if (!photoPath) return null;

    const abs = path.resolve(photoPath);
    if (!fs.existsSync(abs)) {
      console.warn('[cvExportService] Foto registrada pero archivo no encontrado:', abs);
      return null;
    }

    const ext    = path.extname(abs).toLowerCase();
    const mime   = ext === '.png' ? 'image/png' : 'image/jpeg';
    // FIX PRINCIPAL: leer como Buffer, no convertir a base64.
    // PDFKit acepta Buffer directamente y así evitamos errores de
    // re-codificación que hacían que la imagen no se renderizara en el PDF.
    const buffer = fs.readFileSync(abs);

    return { buffer, mime };
  } catch (err) {
    console.warn('[cvExportService] Error al leer la foto de perfil:', err.message);
    return null;
  }
};

// ─── Generador principal ──────────────────────────────────────────────────────
const generateCvPdf = (userId) => new Promise((resolve, reject) => {
  try {
    const summary    = cvService.getSummary(userId);
    const docTypeMap = getDocTypeMap();
    const personalDocType = summary?.personal?.document_type_id
      ? docTypeMap[summary.personal.document_type_id]
      : null;

    // FIX: obtener foto como Buffer (no base64)
    const photo = getUserPhoto(userId);

    // Nombre completo para el encabezado corrido
    const p = summary?.personal;
    const fullName = p
      ? `${p.first_name || ''}${p.middle_name ? ' ' + p.middle_name : ''} ${p.last_name || ''}${p.second_last_name ? ' ' + p.second_last_name : ''}`.trim()
      : 'Servidor Público';

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
      info: {
        Title: 'Hoja de Vida',
        Author: fullName,
        Subject: 'Hoja de Vida — SIGED-2',
        Creator: 'SIGED-2',
        Producer: 'PDFKit',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Encabezado corrido a partir de la página 2
    addRunningHeader(doc, fullName);

    // ── Página 1: portada ────────────────────────────────────────────────────
    // FIX: pasar photo.buffer y photo.mime (en vez de photo.base64)
    renderCoverHeader(doc, summary.personal, personalDocType, photo?.buffer, photo?.mime);

    // Fecha de generación justo bajo la cabecera
    doc.font('Helvetica').fontSize(8.5)
       .fillColor(COLOR.textLight)
       .text(
         `Generado el ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}`,
         MARGIN, doc.y,
         { align: 'right', width: CONTENT_W },
       );
    doc.moveDown(1.2);

    // ── Secciones ────────────────────────────────────────────────────────────
    renderPersonalSection(doc, summary.personal, personalDocType);
    renderEducationSection(doc, summary.education);
    renderWorkSection(doc, summary.work);
    renderManagementSection(doc, summary.management, summary.managementEnabled);

    // ── Nota legal al final del contenido ────────────────────────────────────
    ensureSpace(doc, 50);
    doc.moveDown(1.8);
    drawRule(doc, doc.y, COLOR.accent, 0.8);
    doc.moveDown(0.5);
    doc.font('Helvetica-Oblique').fontSize(8)
       .fillColor(COLOR.textLight)
       .text(
         'Este documento ha sido generado automáticamente por el Sistema de Información y Gestión del Empleo — SIGED-2. ' +
         'La veracidad de la información es responsabilidad del titular. ' +
         'Documento válido únicamente para consulta e impresión interna.',
         MARGIN, doc.y,
         { width: CONTENT_W, align: 'justify' },
       );

    // Finalizar y numerar páginas
    doc.flushPages();
    addPageNumbers(doc);
    doc.end();

  } catch (err) {
    reject(err);
  }
});

module.exports = { generateCvPdf };