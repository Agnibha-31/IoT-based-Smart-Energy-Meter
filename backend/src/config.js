import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const resolvePath = (value, fallback) => {
  const target = value || fallback;
  if (!target) return undefined;
  if (path.isAbsolute(target)) return target;
  return path.resolve(process.cwd(), target);
};

export const config = {
  port: Number(process.env.BACKEND_PORT || process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://iot-based-smart-meter-dashboard.vercel.app' : '*'),
  jwtSecret: process.env.JWT_SECRET || 'smart-meter-secret',
  jwtExpiry: process.env.JWT_EXPIRY || '12h',
  databaseUrl: process.env.DATABASE_URL,
  dbFile: resolvePath(process.env.DB_FILE, './storage/smartmeter.sqlite'), // Legacy - kept for backward compatibility
  deviceDefaultId: process.env.DEVICE_ID || 'meter-001',
  deviceApiKey: process.env.DEVICE_API_KEY || 'CHANGE_ME_DEVICE_KEY',
  baseTariff: Number(process.env.BASE_TARIFF_PER_KWH || 6.5),
  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://iot-based-smart-meter-dashboard-backend.onrender.com' : `http://localhost:${process.env.PORT || 5000}`),
};

export default config;

