require('dotenv').config();
const { initDb } = require('../config/database');

const migrate = async () => {
  const db = await initDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS document_types (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      code      TEXT NOT NULL UNIQUE,
      name      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id                   TEXT PRIMARY KEY,
      document_type_id     INTEGER NOT NULL,
      document_number      TEXT NOT NULL,
      email                TEXT NOT NULL UNIQUE,
      password_hash        TEXT,
      is_active            INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      welcome_email_sent   INTEGER NOT NULL DEFAULT 0,
      gerencia_publica_enabled INTEGER NOT NULL DEFAULT 0,
      login_attempts       INTEGER NOT NULL DEFAULT 0,
      locked_until         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (document_type_id) REFERENCES document_types(id),
      UNIQUE (document_type_id, document_number)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      code  TEXT NOT NULL UNIQUE,
      name  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      role_id     INTEGER NOT NULL,
      start_date  TEXT NOT NULL DEFAULT (date('now')),
      end_date    TEXT,
      assigned_by TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            TEXT NOT NULL,
      token              TEXT NOT NULL UNIQUE,
      token_hash         TEXT NOT NULL,
      temp_password_hash TEXT,
      expires_at         TEXT NOT NULL,
      used               INTEGER NOT NULL DEFAULT 0,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  TEXT NOT NULL,
      revoked     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT,
      action      TEXT NOT NULL,
      entity      TEXT,
      entity_id   TEXT,
      details     TEXT,
      ip_address  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_doc ON users(document_type_id, document_number);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens ON refresh_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

    CREATE TABLE IF NOT EXISTS cv_personal_data (
      user_id              TEXT PRIMARY KEY,
      first_name           TEXT NOT NULL,
      middle_name          TEXT,
      last_name            TEXT NOT NULL,
      second_last_name     TEXT,
      document_type_id     INTEGER NOT NULL,
      document_number      TEXT NOT NULL,
      birth_date           TEXT NOT NULL,
      gender               TEXT NOT NULL,
      phone                TEXT,
      mobile               TEXT NOT NULL,
      email                TEXT NOT NULL,
      country              TEXT NOT NULL,
      department           TEXT NOT NULL,
      city                 TEXT NOT NULL,
      zone_type            TEXT NOT NULL,
      address              TEXT,
      address_complement   TEXT,
      attachment_path      TEXT,
      attachment_name      TEXT,
      photo_path           TEXT,
      photo_name           TEXT,
      validated            INTEGER NOT NULL DEFAULT 0,
      validated_by         TEXT,
      validated_at         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (document_type_id) REFERENCES document_types(id)
    );

    CREATE TABLE IF NOT EXISTS cv_education (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id              TEXT NOT NULL,
      level                TEXT NOT NULL,
      institution          TEXT NOT NULL,
      title                TEXT NOT NULL,
      start_date           TEXT,
      end_date             TEXT,
      professional_card    TEXT,
      attachment_path      TEXT,
      attachment_name      TEXT,
      validated            INTEGER NOT NULL DEFAULT 0,
      validated_by         TEXT,
      validated_at         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cv_work_experience (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id              TEXT NOT NULL,
      experience_type      TEXT NOT NULL,
      employer             TEXT NOT NULL,
      position             TEXT NOT NULL,
      start_date           TEXT NOT NULL,
      end_date             TEXT,
      is_current           INTEGER NOT NULL DEFAULT 0,
      responsibilities     TEXT,
      attachment_path      TEXT,
      attachment_name      TEXT,
      validated            INTEGER NOT NULL DEFAULT 0,
      validated_by         TEXT,
      validated_at         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cv_management (
      user_id              TEXT PRIMARY KEY,
      hierarchical_level   TEXT NOT NULL,
      position_name        TEXT NOT NULL,
      entity_name          TEXT NOT NULL,
      start_date           TEXT NOT NULL,
      attachment_path      TEXT,
      attachment_name      TEXT,
      validated            INTEGER NOT NULL DEFAULT 0,
      validated_by         TEXT,
      validated_at         TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cv_education_user ON cv_education(user_id);
    CREATE INDEX IF NOT EXISTS idx_cv_work_user ON cv_work_experience(user_id);
  `);

  const ensureColumn = (table, column, definition) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (cols.length > 0 && !cols.some(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
    }
  };

  ensureColumn('users', 'welcome_email_sent', 'welcome_email_sent INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'gerencia_publica_enabled', 'gerencia_publica_enabled INTEGER NOT NULL DEFAULT 0');

  ensureColumn('cv_personal_data', 'attachment_path', 'attachment_path TEXT');
  ensureColumn('cv_personal_data', 'attachment_name', 'attachment_name TEXT');
  ensureColumn('cv_personal_data', 'photo_path', 'photo_path TEXT');
  ensureColumn('cv_personal_data', 'photo_name', 'photo_name TEXT');

  ensureColumn('cv_management', 'attachment_path', 'attachment_path TEXT');
  ensureColumn('cv_management', 'attachment_name', 'attachment_name TEXT');

  console.log('Migrations completed successfully');
  process.exit(0);
};

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});