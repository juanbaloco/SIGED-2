require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb } = require('../config/database');

const seed = async () => {
  const db = await initDb();

  // Tipos de documento
  const docTypes = [
    { code: 'CC',  name: 'Cédula de Ciudadanía' },
    { code: 'CE',  name: 'Cédula de Extranjería' },
    { code: 'PA',  name: 'Pasaporte' },
    { code: 'NIT', name: 'NIT' },
  ];
  for (const d of docTypes) {
    db.prepare(`INSERT OR IGNORE INTO document_types (code, name) VALUES (?, ?)`)
      .run(d.code, d.name);
  }

  // Roles
  const roles = [
    { code: 'SERVIDOR', name: 'Servidor Público' },
    { code: 'JTH',      name: 'Jefe de Talento Humano' },
    { code: 'ADMIN',    name: 'Administrador del Sistema' },
  ];
  for (const r of roles) {
    db.prepare(`INSERT OR IGNORE INTO roles (code, name) VALUES (?, ?)`)
      .run(r.code, r.name);
  }

  // Usuario JTH inicial
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@sigep2.gov.co');
  if (!existing) {
    const adminId = uuidv4();
    const passwordHash = await bcrypt.hash('Admin@2024!', parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const ccType = db.prepare(`SELECT id FROM document_types WHERE code = ?`).get('CC');
    const jthRole = db.prepare(`SELECT id FROM roles WHERE code = ?`).get('JTH');

    db.prepare(`
      INSERT INTO users (id, document_type_id, document_number, email, password_hash, is_active, must_change_password)
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `).run(adminId, ccType.id, '00000000', 'admin@sigep2.gov.co', passwordHash);

    db.prepare(`
      INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)
    `).run(adminId, jthRole.id, adminId);

    console.log('✅ Admin JTH creado:');
    console.log('   Email   : admin@sigep2.gov.co');
    console.log('   Documento: CC 00000000');
    console.log('   Password : Admin@2024!');
  } else {
    console.log('ℹ️  Admin ya existe, se omite.');
  }

  console.log('✅ Seed completado');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });