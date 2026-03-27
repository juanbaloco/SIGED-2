const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let _db = null;
const DB_PATH = () => path.resolve(process.env.DB_PATH || './database/sigep2.db');

// ── Capa de compatibilidad: expone la misma API que better-sqlite3 ────────
class SqlJsWrapper {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
  }

  pragma(str) {
    this._db.run(`PRAGMA ${str}`);
  }

  // Devuelve un objeto "statement" con .run(), .get(), .all()
  prepare(sql) {
    const db = this._db;
    return {
      run: (...params) => {
        db.run(sql, this._flatten(params));
        return { changes: db.getRowsModified(), lastInsertRowid: null };
      },
      get: (...params) => {
        const stmt = db.prepare(sql);
        stmt.bind(this._flatten(params));
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params) => {
        const stmt = db.prepare(sql);
        stmt.bind(this._flatten(params));
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
    };
  }

  // Ejecuta múltiples sentencias SQL separadas por punto y coma
  exec(sql) {
    this._db.run(sql);
  }

  // Transacciones: ejecuta fn dentro de BEGIN/COMMIT, rollback si falla
  transaction(fn) {
    return (...args) => {
      this._db.run('BEGIN');
      this._inTransaction = true;
      try {
        fn(...args);
        this._db.run('COMMIT');
      } catch (e) {
        try { this._db.run('ROLLBACK'); } catch (_) {}
        throw e;
      } finally {
        this._inTransaction = false;
      }
    };
  }

  // Persiste la DB en disco
  save() {
    const dbPath = DB_PATH();
    const data = this._db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }

  // Aplanar array de un solo elemento si viene de rest params
  _flatten(params) {
    if (params.length === 1 && Array.isArray(params[0])) return params[0];
    return params;
  }
}

// ── Intercepta .run/.get/.all para auto-guardar en disco ─────────────────
const withAutosave = (wrapper) => {
  const original = wrapper.prepare.bind(wrapper);
  wrapper.prepare = (sql) => {
    const stmt = original(sql);
    const isMutation = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|PRAGMA)/i.test(sql);
    if (isMutation) {
      const origRun = stmt.run.bind(stmt);
      stmt.run = (...args) => {
        const result = origRun(...args);
        if (!wrapper._inTransaction) wrapper.save();
        return result;
      };
    }
    return stmt;
  };

  const origExec = wrapper.exec.bind(wrapper);
  wrapper.exec = (sql) => {
    origExec(sql);
    wrapper.save();
  };

  const origTransaction = wrapper.transaction.bind(wrapper);
  wrapper.transaction = (fn) => {
    const txFn = origTransaction(fn);
    return (...args) => {
      txFn(...args);
      wrapper.save();
    };
  };

  return wrapper;
};

// ── Inicialización asíncrona (llamar una vez al arranque) ─────────────────
const initDb = async () => {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dbPath = DB_PATH();
  const dbDir  = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  let sqlJsDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlJsDb = new SQL.Database(fileBuffer);
  } else {
    sqlJsDb = new SQL.Database();
  }

  const wrapper = new SqlJsWrapper(sqlJsDb);
  wrapper.pragma('foreign_keys = ON');

  _db = withAutosave(wrapper);

  // Auto-migración: columna welcome_email_sent (solo si la tabla ya existe)
  const cols = _db.prepare('PRAGMA table_info(users)').all();
  if (cols.length > 0 && !cols.some(c => c.name === 'welcome_email_sent')) {
    _db.exec('ALTER TABLE users ADD COLUMN welcome_email_sent INTEGER NOT NULL DEFAULT 0');
  }

  return _db;
};

// ── Obtener DB (sincrónico una vez inicializada) ───────────────────────────
const getDb = () => {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
};

module.exports = { initDb, getDb };