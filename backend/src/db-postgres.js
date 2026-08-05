import pg from 'pg';
import config from './config.js';
import { convertQuery } from './utils/queryConverter.js';

const { Pool } = pg;

let pool;

// Initialize PostgreSQL connection pool
const ensurePool = () => {
  if (!pool) {
    const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured. Please set it in your environment variables.');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });

    console.log('✅ PostgreSQL connection pool initialized');
  }
  return pool;
};

// Bootstrap database schema
const bootstrap = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
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
        base_tariff DECIMAL(10, 2) DEFAULT 6.5,
        theme TEXT DEFAULT 'dark',
        notifications TEXT,
        autosave BOOLEAN DEFAULT false,
        refresh_rate INTEGER DEFAULT 5,
        data_retention TEXT DEFAULT '1year',
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);

    // Create devices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        timezone TEXT DEFAULT 'UTC',
        location TEXT DEFAULT 'US-NY',
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        last_seen BIGINT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create readings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        captured_at BIGINT NOT NULL,
        voltage DECIMAL(10, 3),
        current DECIMAL(10, 3),
        real_power_kw DECIMAL(12, 4),
        apparent_power_kva DECIMAL(12, 4),
        reactive_power_kvar DECIMAL(12, 4),
        energy_kwh DECIMAL(15, 5),
        total_energy_kwh DECIMAL(15, 5),
        frequency DECIMAL(10, 3),
        power_factor DECIMAL(6, 4),
        metadata TEXT,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      );
    `);

    // Create exports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exports (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        format TEXT NOT NULL,
        metrics TEXT NOT NULL,
        range_from BIGINT NOT NULL,
        range_to BIGINT NOT NULL,
        created_at BIGINT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_readings_device_time 
      ON readings(device_id, captured_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_devices_user 
      ON devices(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(LOWER(email));
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database
const init = async () => {
  ensurePool();
  await bootstrap();
  console.log('✅ PostgreSQL database ready');
};

// Run a query (INSERT, UPDATE, DELETE)
const run = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const convertedSql = convertQuery(sql);
    const result = await client.query(convertedSql, params);
    return {
      changes: result.rowCount,
      lastID: result.rows[0]?.id || null,
    };
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('SQL:', sql);
    throw error;
  } finally {
    client.release();
  }
};

// Fetch all rows
const all = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const convertedSql = convertQuery(sql);
    const result = await client.query(convertedSql, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('SQL:', sql);
    throw error;
  } finally {
    client.release();
  }
};

// Fetch a single row
const get = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    const convertedSql = convertQuery(sql);
    const result = await client.query(convertedSql, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('SQL:', sql);
    throw error;
  } finally {
    client.release();
  }
};

// Transaction support
const transaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const txDb = {
      run: async (sql, params) => {
        const convertedSql = convertQuery(sql);
        const result = await client.query(convertedSql, params);
        return {
          changes: result.rowCount,
          lastID: result.rows[0]?.id || null,
        };
      },
      all: async (sql, params) => {
        const convertedSql = convertQuery(sql);
        const result = await client.query(convertedSql, params);
        return result.rows;
      },
      get: async (sql, params) => {
        const convertedSql = convertQuery(sql);
        const result = await client.query(convertedSql, params);
        return result.rows[0] || null;
      },
    };

    const result = await fn(txDb);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Close pool (for graceful shutdown)
const close = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ PostgreSQL connection pool closed');
  }
};

export const db = {
  init,
  run,
  all,
  get,
  transaction,
  close,
};

export default db;
