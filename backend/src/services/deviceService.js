import { randomUUID } from 'crypto';
import config from '../config.js';
import { db } from '../db-postgres.js';

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const ensureDefaultDevice = async (userId = null) => {
  const existing = await db.get('SELECT * FROM devices WHERE id = ?', [config.deviceDefaultId]);
  const timestamp = nowSeconds();
  if (!existing && userId) {
    await db.run(
      `INSERT INTO devices (id, user_id, name, api_key, timezone, location, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        config.deviceDefaultId,
        userId,
        'Primary Smart Meter',
        config.deviceApiKey,
        'UTC',
        'US-NY',
        timestamp,
        timestamp,
      ],
    );
    return db.get('SELECT * FROM devices WHERE id = ?', [config.deviceDefaultId]);
  }
  
  // If device exists but has no user_id, assign it to the provided user
  if (existing && !existing.user_id && userId) {
    await db.run(
      'UPDATE devices SET user_id = ?, updated_at = ? WHERE id = ?',
      [userId, timestamp, config.deviceDefaultId],
    );
  }

  if (existing.api_key !== config.deviceApiKey) {
    await db.run(
      'UPDATE devices SET api_key = ?, updated_at = ? WHERE id = ?',
      [config.deviceApiKey, timestamp, config.deviceDefaultId],
    );
  }

  return db.get('SELECT * FROM devices WHERE id = ?', [config.deviceDefaultId]);
};

export const listDevices = async (userId = null) => {
  if (userId) {
    return db.all('SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }
  return db.all('SELECT * FROM devices ORDER BY created_at DESC');
};

export const createDevice = async ({ userId, name, timezone = 'UTC', location = 'US-NY' }) => {
  if (!userId) {
    throw new Error('userId is required to create a device');
  }
  const id = `dev-${randomUUID()}`;
  const apiKey = randomUUID();
  const timestamp = nowSeconds();
  await db.run(
    `INSERT INTO devices (id, user_id, name, api_key, timezone, location, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, name, apiKey, timezone, location, timestamp, timestamp],
  );
  return db.get('SELECT * FROM devices WHERE id = ?', [id]);
};

export const getDeviceById = async (id) =>
  db.get('SELECT * FROM devices WHERE id = ?', [id]);

export const updateDeviceLastSeen = async (deviceId, timestamp = nowSeconds()) => {
  await db.run(
    'UPDATE devices SET last_seen = ?, updated_at = ? WHERE id = ?',
    [timestamp, timestamp, deviceId],
  );
};

export const getDeviceByIdAndUser = async (deviceId, userId) => {
  return db.get('SELECT * FROM devices WHERE id = ? AND user_id = ?', [deviceId, userId]);
};

export const getUserDevices = async (userId) => {
  return db.all('SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC', [userId]);
};

export const regenerateDeviceApiKey = async (deviceId) => {
  console.log('🔄 [REGENERATE] Starting API key regeneration for device:', deviceId);

  const oldDevice = await db.get(
    'SELECT * FROM devices WHERE id = ?',
    [deviceId],
  );

  const newApiKey = randomUUID();
  const timestamp = nowSeconds();

  const result = await db.run(
    'UPDATE devices SET api_key = ?, updated_at = ? WHERE id = ?',
    [newApiKey, timestamp, deviceId],
  );

  console.log(
    '💾 [REGENERATE] Database update completed, rows affected:',
    result.changes,
  );

  const updatedDevice = await db.get(
    'SELECT * FROM devices WHERE id = ?',
    [deviceId],
  );

  console.log(
    '🔍 [REGENERATE] Key rotation verified:',
    Boolean(oldDevice && updatedDevice && oldDevice.api_key !== updatedDevice.api_key),
  );

  return updatedDevice;
};

