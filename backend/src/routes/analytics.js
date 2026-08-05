import { Router } from 'express';
import config from '../config.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { readingsInRange } from '../services/readingService.js';
import { buildSummary, buildCostProjection, bucketizeReadings } from '../services/analyticsService.js';
import { resolveRange, granularityForRange } from '../utils/time.js';

const router = Router();

router.get(
  '/summary',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      // Return empty summary instead of error
      return res.json({
        device_id: deviceId,
        from: 0,
        to: 0,
        intervalSeconds: 3600,
        summary: {
          avgPower: 0,
          maxPower: 0,
          totalEnergy: 0,
          peakDemand: 0,
          avgVoltage: 0,
          avgCurrent: 0,
          avgPowerFactor: 0,
          count: 0
        }
      });
    }
    
    const { from, to, durationSeconds } = resolveRange({
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      timezone: req.user?.timezone || 'UTC',
    });
    const rows = await readingsInRange(deviceId, from, to);
    const intervalSeconds = granularityForRange(durationSeconds);
    const summary = buildSummary(rows, {
      timezone: req.user?.timezone || 'UTC',
      intervalSeconds,
    });
    res.json({
      device_id: deviceId,
      from,
      to,
      intervalSeconds,
      summary,
    });
  }),
);

router.get(
  '/voltage-history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      // Return empty voltage history instead of error
      return res.json({
        device_id: deviceId,
        from: 0,
        to: 0,
        points: []
      });
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
      peak: bucket.peakVoltage,
      minimum: bucket.minVoltage,
    }));
    res.json({
      device_id: deviceId,
      from,
      to,
      intervalSeconds,
      points: series,
    });
  }),
);

router.get(
  '/cost',
  requireAuth,
  asyncHandler(async (req, res) => {
    const deviceId = req.query.device_id || config.deviceDefaultId;
    
    // Verify device belongs to user
    const { getDeviceByIdAndUser } = await import('../services/deviceService.js');
    const device = await getDeviceByIdAndUser(deviceId, req.user.id);
    if (!device) {
      // Return empty cost projection instead of error
      return res.json({
        device_id: deviceId,
        from: 0,
        to: 0,
        projection: {
          totalCost: 0,
          avgDailyCost: 0,
          projectedMonthlyCost: 0,
          baseRate: req.user?.base_tariff ?? config.baseTariff,
          currencySymbol: req.query.symbol || '₹'
        }
      });
    }
    
    const { from, to } = resolveRange({
      period: req.query.period || 'month',
      from: req.query.from,
      to: req.query.to,
      timezone: req.user?.timezone || 'UTC',
    });
    const rows = await readingsInRange(deviceId, from, to);
    const baseRate = req.user?.base_tariff ?? config.baseTariff;
    const projection = buildCostProjection(rows, {
      baseTariff: baseRate,
      currencySymbol: req.query.symbol || '₹',
    });
    res.json({
      device_id: deviceId,
      from,
      to,
      projection,
    });
  }),
);

export default router;

