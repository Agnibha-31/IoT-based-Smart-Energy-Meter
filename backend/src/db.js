import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import config from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wasmDir = path.resolve(__dirname, '../node_modules/sql.js/dist');

let SQL;
let database;

const ensureInstance = async () => {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => path.join(wasmDir, file),
    });
  }

  if (!database) {
    await fs.ensureDir(path.dirname(config.dbFile));
    if (await fs.pathExists(config.dbFile)) {
      const fileBuffer = await fs.readFile(config.dbFile);
      database = new SQL.Database(fileBuffer);
    } else {
      database = new SQL.Database();
    }
    bootstrap();
    persist();
  }

  return database;
};

const persist = () => {
  const data = database.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbFile, buffer);
};

const bootstrap = () => {
  database.run(`
    PRAGMA page_size = 4096;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'operator',
      timezone TEXT DEFAULT 'UTC',
      language TEXT DEFAULT 'en',
      currency TEXT DEFAULT 'USD',
      location TEXT DEFAULT 'US-NY',
      base_tariff REAL DEFAULT 6.5,
      theme TEXT DEFAULT 'dark',
      notifications TEXT,
      autosave INTEGER DEFAULT 0,
      refresh_rate INTEGER DEFAULT 5,
      data_retention TEXT DEFAULT '1year',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      timezone TEXT DEFAULT 'UTC',
      location TEXT DEFAULT 'US-NY',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_seen INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      captured_at INTEGER NOT NULL,
      voltage REAL,
      current REAL,
      real_power_kw REAL,
      apparent_power_kva REAL,
      reactive_power_kvar REAL,
      energy_kwh REAL,
      total_energy_kwh REAL,
      frequency REAL,
      power_factor REAL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE INDEX IF NOT EXISTS idx_readings_device_time ON readings(device_id, captured_at);

    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      format TEXT NOT NULL,
      metrics TEXT NOT NULL,
      range_from INTEGER NOT NULL,
      range_to INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Ensure new columns exist for user preferences without breaking existing DBs
  try {
    const hasColumn = (table, column) => {
      const stmt = database.prepare(`PRAGMA table_info(${table})`);
      let exists = false;
      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.name === column) {
          exists = true;
          break;
        }
      }
      stmt.free();
      return exists;
    };

    if (!hasColumn('users', 'theme')) {
      database.run("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'dark'");
    }
    if (!hasColumn('users', 'notifications')) {
      database.run('ALTER TABLE users ADD COLUMN notifications TEXT');
    }
    if (!hasColumn('users', 'autosave')) {
      database.run('ALTER TABLE users ADD COLUMN autosave INTEGER DEFAULT 0');
    }
    if (!hasColumn('users', 'refresh_rate')) {
      database.run('ALTER TABLE users ADD COLUMN refresh_rate INTEGER DEFAULT 5');
    }
    if (!hasColumn('users', 'data_retention')) {
      database.run("ALTER TABLE users ADD COLUMN data_retention TEXT DEFAULT '1year'");
    }
    
    // Add user_id to devices table for multi-user support
    if (!hasColumn('devices', 'user_id')) {
      // First, get the first user's ID (for existing devices)
      const firstUser = fetchOne('SELECT id FROM users LIMIT 1', []);
      if (firstUser) {
        database.run(`ALTER TABLE devices ADD COLUMN user_id TEXT`);
        database.run(`UPDATE devices SET user_id = ? WHERE user_id IS NULL`, [firstUser.id]);
      } else {
        database.run(`ALTER TABLE devices ADD COLUMN user_id TEXT`);
      }
    }
  } catch (e) {
    // Ignore migration errors to avoid boot failures
    console.error('Migration error:', e.message);
  }
};

const bindStatement = (stmt, params) => {
  if (!params) return;
  if (Array.isArray(params)) {
    stmt.bind(params);
  } else {
    stmt.bind(params);
  }
};

const runStatement = (sql, params, { skipPersist } = {}) => {
  const stmt = database.prepare(sql);
  bindStatement(stmt, params);
  stmt.run();
  stmt.free();
  if (!skipPersist) persist();
};

const fetchAll = (sql, params = []) => {
  const stmt = database.prepare(sql);
  bindStatement(stmt, params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

const fetchOne = (sql, params = []) => {
  const stmt = database.prepare(sql);
  bindStatement(stmt, params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
};

const transaction = (fn) => {
  database.run('BEGIN TRANSACTION;');
  try {
    const result = fn({
      run: (sql, params) => runStatement(sql, params, { skipPersist: true }),
      all: fetchAll,
      get: fetchOne,
    });
    database.run('COMMIT;');
    persist();
    return result;
  } catch (err) {
    database.run('ROLLBACK;');
    throw err;
  }
};

export const db = {
  init: ensureInstance,
  run: async (sql, params = []) => {
    await ensureInstance();
    runStatement(sql, params);
  },
  all: async (sql, params = []) => {
    await ensureInstance();
    return fetchAll(sql, params);
  },
  get: async (sql, params = []) => {
    await ensureInstance();
    return fetchOne(sql, params);
  },
  transaction: async (fn) => {
    await ensureInstance();
    return transaction(fn);
  },
  persist: async () => {
    await ensureInstance();
    persist();
  },
};

export default db;

