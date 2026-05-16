const PDFDocument = require('pdfkit');
const { getDb } = require('../config/database');
const cvService = require('./cvService');

const safe = (v) => (v === undefined || v === null || v === '' ? 'No registra' : String(v));

const formatDate = (value) => {
  if (!value) return 'No registra';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-CO');
};

const ensureSpace = (doc, extraHeight = 36) => {
  if (doc.y + extraHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

const addField = (doc, label, value) => {
  ensureSpace(doc, 24);
  doc.font('Helvetica-Bold').fontSize(10).text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(safe(value));
};

const addSectionTitle = (doc, title) => {
  ensureSpace(doc, 40);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#003366').text(title);
  doc.moveDown(0.4);
  doc.strokeColor('#d0d7e2').lineWidth(1).moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  doc.moveDown(0.7).fillColor('#000000');
};

const renderPersonalSection = (doc, personal, docTypeName) => {
  addSectionTitle(doc, '1. Datos personales');
  if (!personal) {
    doc.font('Helvetica').fontSize(10).text('No hay información registrada en esta sección.');
    return;
  }

  addField(doc, 'Nombres', `${safe(personal.first_name)} ${personal.middle_name ? personal.middle_name : ''}`.trim());
  addField(doc, 'Apellidos', `${safe(personal.last_name)} ${personal.second_last_name ? personal.second_last_name : ''}`.trim());
  addField(doc, 'Tipo de documento', docTypeName || personal.document_type_id);
  addField(doc, 'Número de documento', personal.document_number);
  addField(doc, 'Fecha de nacimiento', formatDate(personal.birth_date));
  addField(doc, 'Género', personal.gender);
  addField(doc, 'Teléfono', personal.phone);
  addField(doc, 'Celular', personal.mobile);
  addField(doc, 'Correo', personal.email);
  addField(doc, 'País', personal.country);
  addField(doc, 'Departamento', personal.department);
  addField(doc, 'Ciudad/Municipio', personal.city);
  addField(doc, 'Tipo de zona', personal.zone_type);
  addField(doc, 'Dirección', personal.address);
  addField(doc, 'Complemento', personal.address_complement);
};

const renderEducationSection = (doc, list) => {
  addSectionTitle(doc, '2. Formación académica');
  if (!list || list.length === 0) {
    doc.font('Helvetica').fontSize(10).text('No hay información registrada en esta sección.');
    return;
  }

  list.forEach((item, index) => {
    ensureSpace(doc, 92);
    doc.font('Helvetica-Bold').fontSize(10).text(`Registro ${index + 1}`);
    addField(doc, 'Nivel', item.level);
    addField(doc, 'Institución', item.institution);
    addField(doc, 'Título', item.title);
    addField(doc, 'Fecha inicio', formatDate(item.start_date));
    addField(doc, 'Fecha fin', formatDate(item.end_date));
    addField(doc, 'Tarjeta profesional', item.professional_card);
    doc.moveDown(0.5);
  });
};

const renderWorkSection = (doc, list) => {
  addSectionTitle(doc, '3. Experiencia laboral');
  if (!list || list.length === 0) {
    doc.font('Helvetica').fontSize(10).text('No hay información registrada en esta sección.');
    return;
  }

  list.forEach((item, index) => {
    ensureSpace(doc, 110);
    doc.font('Helvetica-Bold').fontSize(10).text(`Registro ${index + 1}`);
    addField(doc, 'Tipo de experiencia', item.experience_type);
    addField(doc, 'Entidad/Empleador', item.employer);
    addField(doc, 'Cargo', item.position);
    addField(doc, 'Fecha inicio', formatDate(item.start_date));
    addField(doc, 'Fecha fin', item.is_current ? 'Actual' : formatDate(item.end_date));
    addField(doc, 'Responsabilidades', item.responsibilities);
    doc.moveDown(0.5);
  });
};

const renderManagementSection = (doc, management, enabled) => {
  if (!enabled) return;

  addSectionTitle(doc, '4. Gerencia Pública');
  if (!management) {
    doc.font('Helvetica').fontSize(10).text('No hay información registrada en esta sección.');
    return;
  }

  addField(doc, 'Nivel jerárquico', management.hierarchical_level);
  addField(doc, 'Nombre del cargo', management.position_name);
  addField(doc, 'Entidad', management.entity_name);
  addField(doc, 'Fecha de posesión', formatDate(management.start_date));
};

const getDocTypeMap = () => {
  const rows = getDb().prepare('SELECT id, name FROM document_types').all();
  return rows.reduce((acc, row) => {
    acc[row.id] = row.name;
    return acc;
  }, {});
};

const generateCvPdf = (userId) => new Promise((resolve, reject) => {
  try {
    const summary = cvService.getSummary(userId);
    const docTypeMap = getDocTypeMap();
    const personalDocType = summary?.personal?.document_type_id
      ? docTypeMap[summary.personal.document_type_id]
      : null;

    const doc = new PDFDocument({ size: 'A4', margin: 46 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#003366').text('Hoja de Vida', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(10).fillColor('#4a4a4a').text(`Generado el ${new Date().toLocaleString('es-CO')}`, { align: 'center' });
    doc.moveDown(1);

    renderPersonalSection(doc, summary.personal, personalDocType);
    renderEducationSection(doc, summary.education);
    renderWorkSection(doc, summary.work);
    renderManagementSection(doc, summary.management, summary.managementEnabled);

    doc.moveDown(1.4);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666666')
      .text('Documento generado por SIGED-2 para fines de consulta e impresión.', { align: 'center' });

    doc.end();
  } catch (err) {
    reject(err);
  }
});

module.exports = {
  generateCvPdf,
};