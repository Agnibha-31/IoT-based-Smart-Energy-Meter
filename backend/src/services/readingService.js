import { db } from '../db-postgres.js';
import { updateDeviceLastSeen } from './deviceService.js';

const nowSeconds = () => Math.floor(Date.now() / 1000);

const clamp = (value, min, max) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.min(Math.max(value, min), max);
};

const round = (value, decimals = 3) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const computeDerivedMetrics = (input) => {
  const voltage = input.voltage != null ? Number(input.voltage) : null;
  const current = input.current != null ? Number(input.current) : null;
  const energy = input.energy != null ? Number(input.energy) : null;
  const frequency = input.frequency != null ? Number(input.frequency) : null;

  const powerWatts = input.power != null ? Number(input.power) : voltage && current ? voltage * current : null;
  const realPowerKw = powerWatts != null ? powerWatts / 1000 : null;
  const apparentPowerKva = input.apparent_power != null
    ? Number(input.apparent_power)
    : voltage != null && current != null
      ? (voltage * current) / 1000
      : null;

  let pf = input.power_factor != null ? Number(input.power_factor) : null;
  if (pf == null && realPowerKw != null && apparentPowerKva) {
    pf = apparentPowerKva === 0 ? null : realPowerKw / apparentPowerKva;
  }
  pf = pf != null ? clamp(pf, 0, 1) : null;

  const reactivePowerKvar = input.reactive_power != null
    ? Number(input.reactive_power)
    : realPowerKw != null && apparentPowerKva != null
      ? Math.sqrt(Math.max(apparentPowerKva ** 2 - realPowerKw ** 2, 0))
      : null;

  return {
    voltage: voltage != null ? round(voltage, 3) : null,
    current: current != null ? round(current, 3) : null,
    real_power_kw: realPowerKw != null ? round(realPowerKw, 4) : null,
    apparent_power_kva: apparentPowerKva != null ? round(apparentPowerKva, 4) : null,
    reactive_power_kvar: reactivePowerKvar != null ? round(reactivePowerKvar, 4) : null,
    energy_kwh: energy != null ? round(energy, 5) : null,
    total_energy_kwh: energy != null ? round(energy, 5) : null,
    frequency: frequency != null ? round(frequency, 3) : null,
    power_factor: pf != null ? round(pf, 4) : null,
  };
};

export const ingestReading = async ({ deviceId, payload }) => {
  const capturedAt = payload.timestamp
    ? Math.floor(Number(payload.timestamp))
    : nowSeconds();
  const derived = computeDerivedMetrics(payload);
  const metadata = payload.metadata ? JSON.stringify(payload.metadata) : null;

  await db.run(
    `INSERT INTO readings (
      device_id,
      captured_at,
      voltage,
      current,
      real_power_kw,
      apparent_power_kva,
      reactive_power_kvar,
      energy_kwh,
      total_energy_kwh,
      frequency,
      power_factor,
      metadata,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      deviceId,
      capturedAt,
      derived.voltage,
      derived.current,
      derived.real_power_kw,
      derived.apparent_power_kva,
      derived.reactive_power_kvar,
      derived.energy_kwh,
      derived.total_energy_kwh,
      derived.frequency,
      derived.power_factor,
      metadata,
      nowSeconds(),
    ],
  );

  await updateDeviceLastSeen(deviceId, capturedAt);

  return db.get(
    'SELECT * FROM readings WHERE device_id = ? ORDER BY id DESC LIMIT 1',
    [deviceId],
  );
};

export const latestReading = async (deviceId) =>
  db.get(
    'SELECT * FROM readings WHERE device_id = ? ORDER BY captured_at DESC, id DESC LIMIT 1',
    [deviceId],
  );

export const readingsInRange = async (deviceId, fromEpoch, toEpoch) =>
  db.all(
    `SELECT * FROM readings
     WHERE device_id = ?
       AND captured_at BETWEEN ? AND ?
     ORDER BY captured_at ASC`,
    [deviceId, fromEpoch, toEpoch],
  );

export const deleteReadingsBefore = async (deviceId, beforeEpoch) =>
  db.run(
    'DELETE FROM readings WHERE device_id = ? AND captured_at <= ?',
    [deviceId, beforeEpoch],
  );


