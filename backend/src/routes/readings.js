import { Router } from 'express';
import { z } from 'zod';
import config from '../config.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireDeviceKey, requireAuth } from '../middleware/auth.js';
import {
  ingestReading,
  latestReading,
  readingsInRange,
  deleteReadingsBefore,
} from '../services/readingService.js';
import { resolveRange, granularityForRange } from '../utils/time.js';
import { bucketizeReadings } from '../services/analyticsService.js';
import bus from '../utils/bus.js';

const router = Router();

const ingestSchema = z.object({
  voltage: z.number().optional(),
  current: z.number().optional(),
  power: z.number().optional(),
  energy: z.number().optional(),
  frequency: z.number().optional(),
  timestamp: z.number().optional(),
  power_factor: z.number().optional(),
  apparent_power: z.number().optional(),
  apparentPower: z.number().optional(),
  powerFactor: z.number().optional(),
  reactive_power: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post(
  '/',
  requireDeviceKey,
  asyncHandler(async (req, res) => {
    const rawPayload = ingestSchema.parse(req.body ?? {});
    const payload = {
      ...rawPayload,
      power_factor: rawPayload.power_factor ?? rawPayload.powerFactor,
      apparent_power: rawPayload.apparent_power ?? rawPayload.apparentPower,
    };
    const reading = await ingestReading({
      deviceId: req.device.id,
      payload,
    });
    bus.emit('reading:new', reading);
    res.status(201).json({ reading });
  }),
);

router.get(
  '/latest',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      return res.status(403).json({ error: 'Access denied to this device' });
    }
    
    const reading = await latestReading(deviceId);
    res.json({ reading });
  }),
);

router.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      return res.status(403).json({ error: 'Access denied to this device' });
    }
    
    const { from, to, durationSeconds } = resolveRange({
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      timezone: req.user?.timezone || 'UTC',
    });
    const rows = await readingsInRange(deviceId, from, to);
    const intervalSeconds = Number(req.query.interval_seconds) || granularityForRange(durationSeconds);
    const series = bucketizeReadings(rows, intervalSeconds).map((bucket) => ({
      timestamp: bucket.timestamp,
      voltage: bucket.voltage,
      peakVoltage: bucket.peakVoltage,
      minVoltage: bucket.minVoltage,
      current: bucket.current,
      realPowerKw: bucket.realPower,
      energyKwh: bucket.energy,
      powerFactor: bucket.powerFactor,
    }));

    res.json({
      device_id: deviceId,
      from,
      to,
      intervalSeconds,
      points: series,
      rawCount: rows.length,
    });
  }),
);

router.delete(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      return res.status(403).json({ error: 'Access denied to this device' });
    }
    
    const before = Number(req.query.before) || Math.floor(Date.now() / 1000);
    await deleteReadingsBefore(deviceId, before);
    res.json({ success: true });
  }),
);

router.get(
  '/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      // Return empty stats instead of error
      return res.json({
        device_id: deviceId,
        total_readings: 0,
        earliest_timestamp: null,
        latest_timestamp: null,
        earliest_date: null,
        latest_date: null,
        time_span_days: 0,
        database_size_mb: '0.00',
        metrics_availability: {
          voltage: 0,
          current: 0,
          power: 0,
          energy: 0,
          power_factor: 0,
          frequency: 0,
        },
        last_updated: new Date().toISOString()
      });
    }
    
    const { db } = await import('../db.js');
    
    // Get total count
    const countResult = await db.get(
      'SELECT COUNT(*) as total FROM readings WHERE device_id = ?',
      [deviceId]
    );
    
    // Get date range
    const rangeResult = await db.get(
      `SELECT 
        MIN(captured_at) as earliest_timestamp,
        MAX(captured_at) as latest_timestamp
       FROM readings WHERE device_id = ?`,
      [deviceId]
    );
    
    // Get size estimate (SQLite page count * page size)
    const sizeResult = await db.get('PRAGMA page_count');
    const pageSizeResult = await db.get('PRAGMA page_size');
    const dbSizeBytes = (sizeResult.page_count || 0) * (pageSizeResult.page_size || 4096);
    
    // Calculate metrics availability
    const metricsResult = await db.get(
      `SELECT 
        COUNT(CASE WHEN voltage IS NOT NULL THEN 1 END) as has_voltage,
        COUNT(CASE WHEN current IS NOT NULL THEN 1 END) as has_current,
        COUNT(CASE WHEN real_power_kw IS NOT NULL THEN 1 END) as has_power,
        COUNT(CASE WHEN energy_kwh IS NOT NULL THEN 1 END) as has_energy,
        COUNT(CASE WHEN power_factor IS NOT NULL THEN 1 END) as has_power_factor,
        COUNT(CASE WHEN frequency IS NOT NULL THEN 1 END) as has_frequency
       FROM readings WHERE device_id = ?`,
      [deviceId]
    );
    
    const total = countResult?.total || 0;
    const earliest = rangeResult?.earliest_timestamp || null;
    const latest = rangeResult?.latest_timestamp || null;
    
    res.json({
      device_id: deviceId,
      total_readings: total,
      earliest_timestamp: earliest,
      latest_timestamp: latest,
      earliest_date: earliest ? new Date(earliest * 1000).toISOString() : null,
      latest_date: latest ? new Date(latest * 1000).toISOString() : null,
      time_span_days: earliest && latest ? ((latest - earliest) / 86400).toFixed(2) : 0,
      database_size_mb: (dbSizeBytes / (1024 * 1024)).toFixed(2),
      metrics_availability: {
        voltage: metricsResult?.has_voltage || 0,
        current: metricsResult?.has_current || 0,
        power: metricsResult?.has_power || 0,
        energy: metricsResult?.has_energy || 0,
        power_factor: metricsResult?.has_power_factor || 0,
        frequency: metricsResult?.has_frequency || 0,
      },
      last_updated: new Date().toISOString()
    });
  }),
);

export default router;

