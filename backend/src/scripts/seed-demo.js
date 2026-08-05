import { db } from '../db-postgres.js';
import { ensureDefaultDevice } from '../services/deviceService.js';
import { findUserByEmail, createUser } from '../services/authService.js';
import { ingestReading } from '../services/readingService.js';

const randomWithin = (base, variance = 1) =>
  base + (Math.random() - 0.5) * variance * 2;

const run = async () => {
  await db.init();
  const device = await ensureDefaultDevice();

  const adminEmail = 'admin@smartmeter.local';
  let admin = await findUserByEmail(adminEmail);
  if (!admin) {
    admin = await createUser({
      email: adminEmail,
      password: 'Admin@123',
      name: 'Grid Admin',
      role: 'admin',
      timezone: 'UTC',
      location: 'IN-DL',
      currency: 'INR',
    });
    console.log('Created default admin user (admin@smartmeter.local / Admin@123)');
  }

  const now = Math.floor(Date.now() / 1000);
  const start = now - 48 * 3600; // 48 hours
  let timestamp = start;
  let energy = 1000;

  const existing = await db.get('SELECT COUNT(*) as total FROM readings');
  if (existing?.total > 0) {
    console.log('Readings already exist, skipping telemetry seeding.');
    return;
  }

  while (timestamp <= now) {
    const hour = new Date(timestamp * 1000).getHours();
    const dayFactor = hour >= 17 && hour <= 22 ? 1.4 : hour >= 0 && hour <= 5 ? 0.6 : 1;
    const voltage = randomWithin(228, 3);
    const current = randomWithin(8 * dayFactor, 1.5);
    const realPowerKw = (voltage * current * 0.92) / 1000;
    energy += realPowerKw * (5 / 60);

    await ingestReading({
      deviceId: device.id,
      payload: {
        voltage,
        current,
        power: realPowerKw * 1000,
        energy,
        frequency: randomWithin(50, 0.05),
        power_factor: randomWithin(0.94, 0.03),
        timestamp,
      },
    });

    timestamp += 300; // 5 minutes
  }

  console.log('Seeded demo telemetry successfully.');
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
  });

