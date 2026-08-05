import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../config.js';
import { db } from '../db-postgres.js';

const SALT_ROUNDS = 10;

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  // Parse notifications JSON if stored as TEXT
  if (typeof rest.notifications === 'string') {
    try {
      rest.notifications = JSON.parse(rest.notifications);
    } catch {
      rest.notifications = null;
    }
  }
  if (typeof rest.autosave !== 'undefined') {
    rest.autosave = Boolean(rest.autosave);
  }
  if (typeof rest.refresh_rate !== 'undefined' && rest.refresh_rate !== null) {
    rest.refresh_rate = Number(rest.refresh_rate);
  }
  return rest;
};

export const issueToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry },
  );

export const verifyPassword = async (plaintext, hash) => bcrypt.compare(plaintext, hash);

export const hashPassword = async (plaintext) => bcrypt.hash(plaintext, SALT_ROUNDS);

export const findUserByEmail = async (email) =>
  db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);

export const findUserById = async (id) =>
  db.get('SELECT * FROM users WHERE id = ?', [id]);

export const countUsers = async () => {
  const row = await db.get('SELECT COUNT(*) as total FROM users');
  return row?.total ?? 0;
};

export const createUser = async ({
  email,
  password,
  name,
  role = 'operator',
  timezone = 'UTC',
  language = 'en',
  currency = 'USD',
  location = 'US-NY',
  base_tariff,
  theme = 'dark',
  notifications = null,
  autosave = false,
  refresh_rate = 5,
  data_retention = '1year',
}) => {
  const now = Math.floor(Date.now() / 1000);
  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  await db.run(
    `INSERT INTO users (id, email, name, password_hash, role, timezone, language, currency, location, base_tariff, theme, notifications, autosave, refresh_rate, data_retention, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      email,
      name,
      passwordHash,
      role,
      timezone,
      language,
      currency,
      location,
      base_tariff ?? config.baseTariff,
      theme,
      notifications ? JSON.stringify(notifications) : null,
      Boolean(autosave),
      Number(refresh_rate) || 5,
      data_retention,
      now,
      now,
    ],
  );
  
  // Automatically create a default device for the new user
  const { createDevice } = await import('./deviceService.js');
  await createDevice({
    userId,
    name: 'Primary Smart Meter',
    timezone,
    location,
  });
  
  return findUserById(userId);
};

export const updateUserProfile = async (id, updates) => {
  const allowed = ['name', 'timezone', 'language', 'currency', 'location', 'base_tariff', 'theme', 'notifications', 'autosave', 'refresh_rate', 'data_retention'];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });
  if (payload.notifications && typeof payload.notifications !== 'string') {
    try {
      payload.notifications = JSON.stringify(payload.notifications);
    } catch {
      delete payload.notifications;
    }
  }
  if (payload.autosave !== undefined) {
    payload.autosave = Boolean(payload.autosave);
  }
  if (payload.refresh_rate !== undefined) {
    const rr = Number(payload.refresh_rate);
    if (!Number.isFinite(rr) || rr <= 0) {
      delete payload.refresh_rate;
    } else {
      payload.refresh_rate = Math.floor(rr);
    }
  }
  if (!Object.keys(payload).length) {
    return findUserById(id);
  }
  const assignments = Object.keys(payload).map((key) => `${key} = ?`);
  const values = Object.values(payload);
  const now = Math.floor(Date.now() / 1000);
  await db.run(
    `UPDATE users SET ${assignments.join(', ')}, updated_at = ? WHERE id = ?`,
    [...values, now, id],
  );
  return findUserById(id);
};

export const changePassword = async (id, currentPassword, newPassword) => {
  const user = await findUserById(id);
  if (!user) throw new Error('User not found');
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) throw new Error('Current password incorrect');
  const newHash = await hashPassword(newPassword);
  await db.run(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    [newHash, Math.floor(Date.now() / 1000), id],
  );
  return true;
};

