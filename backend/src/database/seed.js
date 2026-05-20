require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb } = require('../config/database');

const ADMIN_PASSWORD = 'Admin@2026!';

const seed = async () => {
  const db = await initDb();

  const docTypes = [
    { code: 'CC',  name: 'Cedula de Ciudadania' },
    { code: 'CE',  name: 'Cedula de Extranjeria' },
    { code: 'PA',  name: 'Pasaporte' },
    { code: 'NIT', name: 'NIT' },
  ];

  for (const d of docTypes) {
    db.prepare(`INSERT OR IGNORE INTO document_types (code, name) VALUES (?, ?)`)
      .run(d.code, d.name);
  }

  const roles = [
    { code: 'SERVIDOR', name: 'Servidor Publico' },
    { code: 'JTH',      name: 'Jefe de Talento Humano' },
    { code: 'ADMIN',    name: 'Administrador del Sistema' },
  ];

  for (const r of roles) {
    db.prepare(`INSERT OR IGNORE INTO roles (code, name) VALUES (?, ?)`)
      .run(r.code, r.name);
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@sigep2.gov.co');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const ccType = db.prepare(`SELECT id FROM document_types WHERE code = ?`).get('CC');
  const jthRole = db.prepare(`SELECT id FROM roles WHERE code = ?`).get('JTH');

  if (!existing) {
    const adminId = uuidv4();

    db.prepare(`
      INSERT INTO users (
        id, document_type_id, document_number, email, password_hash,
        is_active, must_change_password, login_attempts, locked_until
      )
      VALUES (?, ?, ?, ?, ?, 1, 0, 0, NULL)
    `).run(adminId, ccType.id, '00000000', 'admin@sigep2.gov.co', passwordHash);

    db.prepare(`
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES (?, ?, ?)
    `).run(adminId, jthRole.id, adminId);

    console.log('Admin JTH creado:');
  } else {
    db.prepare(`
      UPDATE users
      SET document_type_id = ?,
          document_number = ?,
          password_hash = ?,
          is_active = 1,
          must_change_password = 0,
          login_attempts = 0,
          locked_until = NULL,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(ccType.id, '00000000', passwordHash, existing.id);

    const hasRole = db.prepare(`
      SELECT id FROM user_roles
      WHERE user_id = ? AND role_id = ? AND (end_date IS NULL OR end_date >= date('now'))
    `).get(existing.id, jthRole.id);

    if (!hasRole) {
      db.prepare(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `).run(existing.id, jthRole.id, existing.id);
    }

    console.log('Admin JTH actualizado:');
  }

  console.log('   Email    : admin@sigep2.gov.co');
  console.log('   Documento: CC 00000000');
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log('Seed completado');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});